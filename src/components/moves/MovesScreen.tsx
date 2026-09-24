"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Move } from "@/app/api/moves/route";
import { PLAN_KEY } from "@/lib/storageKeys";
import { formatUsdc } from "@/lib/units";
import { networkCopy, withdrawalCopy } from "@/lib/vaultCopy";
import {
  connectWallet,
  decodeApprove,
  disconnectWallet,
  hasWallet,
  readNativeBalance,
  readAllowance,
  readTokenBalance,
  sendAndConfirm,
  switchWalletChain,
  walletChainId,
  WalletError,
} from "@/lib/wallet";
import type { PlanResult } from "../plan/PlanView";
import { Arrow } from "../SiteNav";

type StepState =
  | { kind: "idle" }
  | { kind: "skipped" }
  | { kind: "confirm" }
  | { kind: "pending"; hash: string }
  | { kind: "done"; hash: string }
  | { kind: "reverted"; hash: string }
  | { kind: "error"; message: string };

type Load = { kind: "idle" } | { kind: "loading" } | { kind: "ready"; moves: Move[] } | { kind: "stale"; message: string } | { kind: "error"; message: string };

const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;
const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function readPlan(): PlanResult | null {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    return raw ? (JSON.parse(raw) as PlanResult) : null;
  } catch {
    return null;
  }
}

const stepKey = (sig: string, m: number, s: number) => `ebbryn.tx.${sig.slice(0, 16)}.${m}.${s}`;

function stepTitle(type: string, move: Move, exact: boolean): string {
  if (type.includes("approve")) return exact ? `Approve exactly ${formatUsdc(move.amount)} USDC for ${move.vaultName}` : `Approve USDC for ${move.vaultName}`;
  if (type.includes("deposit")) return `Deposit ${formatUsdc(move.amount)} USDC into ${move.vaultName}`;
  return type.replace(/_/g, " ");
}

export function MovesScreen() {
  const [plan, setPlan] = useState<PlanResult | null | undefined>(undefined);
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [walletMsg, setWalletMsg] = useState<string | null>(null);
  const [load, setLoad] = useState<Load>({ kind: "idle" });
  const [balance, setBalance] = useState<number | null>(null);
  const [gas, setGas] = useState<number | null>(null);
  const [steps, setSteps] = useState<Record<string, StepState>>({});

  useEffect(() => {
    setPlan(readPlan());
  }, []);

  // Keep network and account in sync with the wallet.
  useEffect(() => {
    const eth = typeof window !== "undefined" ? window.ethereum : undefined;
    if (!eth?.on) return;
    const onChain = (hex: string) => setChainId(parseInt(hex, 16));
    const onAccounts = (accs: string[]) => setAccount((accs[0] as `0x${string}`) ?? null);
    eth.on("chainChanged", onChain);
    eth.on("accountsChanged", onAccounts);
    return () => {
      eth.removeListener?.("chainChanged", onChain);
      eth.removeListener?.("accountsChanged", onAccounts);
    };
  }, []);

  const signature = plan?.signature ?? null;

  const buildMoves = useCallback(
    async (owner: `0x${string}`) => {
      if (!plan || !signature) return;
      setLoad({ kind: "loading" });
      try {
        const res = await fetch("/api/moves", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ inputs: plan.inputs, plan: plan.plan, signature, owner }),
        });
        const body = await res.json().catch(() => ({}));
        if (res.status === 409) return setLoad({ kind: "stale", message: body.error ?? "This plan is out of date." });
        if (!res.ok) return setLoad({ kind: "error", message: body.error ?? "Couldn't build the moves. Nothing was changed." });
        const moves = body.moves as Move[];
        setLoad({ kind: "ready", moves });

        // Restore confirmed steps from this browser, then check what's already on chain.
        const restored: Record<string, StepState> = {};
        moves.forEach((m, mi) =>
          m.steps.forEach((_, si) => {
            try {
              const hash = localStorage.getItem(stepKey(signature, mi, si));
              if (hash) restored[`${mi}.${si}`] = { kind: "done", hash };
            } catch {
              /* storage blocked */
            }
          }),
        );
        const first = moves[0];
        if (first) {
          const [bal, allowance, native] = await Promise.all([
            readTokenBalance(first.chainId, first.asset, owner, first.decimals).catch(() => null),
            readAllowance(first.chainId, first.asset, owner, first.vaultAddress).catch(() => null),
            readNativeBalance(first.chainId, owner).catch(() => null),
          ]);
          setBalance(bal);
          setGas(native);
          moves.forEach((m, mi) =>
            m.steps.forEach((s, si) => {
              if (s.type.includes("approve") && allowance !== null && allowance >= BigInt(m.baseUnits) && !restored[`${mi}.${si}`]) {
                restored[`${mi}.${si}`] = { kind: "skipped" };
              }
            }),
          );
        }
        setSteps(restored);
      } catch {
        setLoad({ kind: "error", message: "Couldn't reach Ebbryn. Nothing was changed." });
      }
    },
    [plan, signature],
  );

  const connect = async () => {
    setWalletMsg(null);
    try {
      const acc = await connectWallet();
      setAccount(acc);
      setChainId(await walletChainId());
      await buildMoves(acc);
    } catch (e) {
      setWalletMsg(e instanceof WalletError ? e.message : "The wallet couldn't connect.");
    }
  };

  const disconnect = async () => {
    await disconnectWallet();
    setAccount(null);
    setChainId(null);
    setLoad({ kind: "idle" });
    setBalance(null);
    setGas(null);
    setSteps({});
    setWalletMsg(null);
  };

  const switchTo = async (id: number) => {
    setWalletMsg(null);
    try {
      await switchWalletChain(id);
      setChainId(await walletChainId());
    } catch (e) {
      setWalletMsg(e instanceof WalletError ? e.message : "The wallet couldn't switch networks.");
    }
  };

  const sign = async (mi: number, si: number, move: Move) => {
    if (!account || !signature) return;
    const key = `${mi}.${si}`;
    setSteps((s) => ({ ...s, [key]: { kind: "confirm" } }));
    try {
      const out = await sendAndConfirm(move.chainId, account, move.steps[si].tx, (hash) =>
        setSteps((s) => ({ ...s, [key]: { kind: "pending", hash } })),
      );
      if (out.status === "success") {
        try {
          localStorage.setItem(stepKey(signature, mi, si), out.hash);
        } catch {
          /* storage blocked */
        }
        setSteps((s) => ({ ...s, [key]: { kind: "done", hash: out.hash } }));
      } else {
        setSteps((s) => ({ ...s, [key]: { kind: "reverted", hash: out.hash } }));
      }
    } catch (e) {
      setSteps((s) => ({ ...s, [key]: { kind: "error", message: e instanceof WalletError ? e.message : "Something went wrong. Nothing moved." } }));
    }
  };

  if (plan === undefined) return <div className="min-h-[50vh]" aria-busy="true" />;

  if (!plan || !plan.check.ok || !signature) {
    return (
      <div className="flex flex-col gap-5 py-6">
        <p className="label">Step 3 of 3</p>
        <h1 className="display-section text-ink">No plan ready to sign.</h1>
        <p className="max-w-[560px] text-[16px] text-charcoal">Moves open once a plan passes all 8 checks. Make a plan first.</p>
        <div>
          <Link href="/plan" className="btn btn-primary">
            Go to plan
            <Arrow />
          </Link>
        </div>
      </div>
    );
  }

  const parkedTotal = plan.plan.parked.reduce((s, p) => s + p.amount, 0);
  const moves = load.kind === "ready" ? load.moves : [];
  const need = moves[0]?.amount ?? parkedTotal;
  const wrongChain = moves[0] && chainId !== null && chainId !== moves[0].chainId;
  const shortOfFunds = balance !== null && balance + 1e-9 < need;
  const MIN_GAS = 0.002;
  const noGas = gas !== null && gas < MIN_GAS;
  const gasSymbol = moves[0]?.chainId === 97 ? "BNB" : "gas";
  const allDone = moves.length > 0 && moves.every((m, mi) => m.steps.every((_, si) => ["done", "skipped"].includes(steps[`${mi}.${si}`]?.kind ?? "")));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <p className="label">Step 3 of 3</p>
        <h1 className="display-section text-ink">
          {allDone ? (
            <>
              <span className="tabular-nums">{formatUsdc(parkedTotal)}</span> USDC is parked.
            </>
          ) : (
            <>
              Sign to park <span className="tabular-nums">{formatUsdc(parkedTotal)}</span> USDC.
            </>
          )}
        </h1>
      </header>

      <section className="flex flex-col gap-4 rounded-[16px] bg-cloud p-5" style={{ boxShadow: "var(--shadow-cloud)" }} aria-label="Wallet">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {account ? (
            <p className="text-[15px] text-ink">
              Wallet <span className="num">{short(account)}</span>
            </p>
          ) : hasWallet() ? (
            <p className="text-[15px] text-charcoal">Connect the wallet that holds the USDC. Nothing is signed until you approve each step.</p>
          ) : (
            <p className="text-[15px] text-charcoal">
              Ebbryn needs a browser wallet like{" "}
              <a href="https://metamask.io" target="_blank" rel="noreferrer" className="text-ink underline underline-offset-4">
                MetaMask
              </a>{" "}
              to sign.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {!account && hasWallet() && (
              <button type="button" onClick={connect} className="btn btn-primary">
                Connect wallet
                <Arrow />
              </button>
            )}
            {account && wrongChain && moves[0] && (
              <button type="button" onClick={() => switchTo(moves[0].chainId)} className="btn btn-primary">
                Switch to {networkCopy(moves[0].network)}
              </button>
            )}
            {account && (
              <button type="button" onClick={disconnect} className="btn btn-soft bg-paper">
                Disconnect
              </button>
            )}
          </div>
        </div>

        {!account &&
          (() => {
            const target = plan.plan.parked.map((p) => plan.vaults.find((v) => v.id === p.vaultId)).filter(Boolean)[0];
            return (
              <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2 border-t border-steel pt-4 text-[14px]">
                <dt className="text-slate">Destination</dt>
                <dd className="text-ink">{target?.name ?? "IXS vault"}</dd>
                <dt className="text-slate">Network</dt>
                <dd className="text-ink">{target ? networkCopy(target.network) : "Set by the vault"}</dd>
                <dt className="text-slate">Amount</dt>
                <dd className="num text-ink">{formatUsdc(parkedTotal)} USDC</dd>
                <dt className="text-slate">Actions</dt>
                <dd className="text-ink">Up to 2 signatures: approve, then deposit</dd>
              </dl>
            );
          })()}

        {account && moves[0] && (
          <dl className="num grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-2 border-t border-steel pt-4 text-[13px]">
            {[
              ["USDC", balance === null ? "Reading" : formatUsdc(balance), balance !== null && !shortOfFunds],
              [`${gasSymbol} for gas`, gas === null ? "Reading" : gas.toFixed(4), gas !== null && !noGas],
              ["Network", wrongChain ? "Other network" : networkCopy(moves[0].network), !wrongChain && chainId !== null],
            ].map(([label, value, ok]) => (
              <div key={String(label)} className="contents">
                <dt className="text-charcoal">{label}</dt>
                <dd className="text-right text-ink">{value}</dd>
                <dd aria-label={ok ? "ready" : "not ready"}>
                  <span
                    className="grid h-5 w-5 place-items-center rounded-[6px] text-[12px]"
                    style={ok ? { background: "#bff660", color: "#18181b" } : { background: "#b3261e", color: "#ffffff" }}
                  >
                    {ok ? "✓" : "×"}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
      {walletMsg && <p className="-mt-4 text-[14px] text-alert">{walletMsg}</p>}

      {load.kind === "loading" && <p className="text-[15px] text-charcoal">Asking IXS to build your transactions.</p>}
      {load.kind === "error" && (
        <div className="flex flex-col gap-3">
          <p className="rounded-[12px] p-4 text-[15px] text-ink" style={{ boxShadow: "inset 0 0 0 1px #b3261e" }}>{load.message}</p>
          {account && (
            <button type="button" className="btn btn-dark self-start" onClick={() => buildMoves(account)}>
              Try again
            </button>
          )}
        </div>
      )}
      {load.kind === "stale" && (
        <div className="flex flex-col gap-3">
          <p className="rounded-[12px] p-4 text-[15px] text-ink" style={{ boxShadow: "inset 0 0 0 1px #b3261e" }}>{load.message}</p>
          <Link href="/plan" className="btn btn-dark self-start">
            Replan
          </Link>
        </div>
      )}

      {shortOfFunds && !allDone && moves[0] && (
        <p className="rounded-[12px] p-4 text-[15px] text-ink" style={{ boxShadow: "inset 0 0 0 1px #b3261e" }}>
          This wallet has {formatUsdc(balance!)} IXS test USDC on {networkCopy(moves[0].network)}. You need {formatUsdc(need)} USDC to complete this deposit.
        </p>
      )}

      {noGas && !allDone && moves[0] && (
        <p className="rounded-[12px] p-4 text-[15px] text-ink" style={{ boxShadow: "inset 0 0 0 1px #b3261e" }}>
          This wallet has {gas!.toFixed(4)} {gasSymbol} on {networkCopy(moves[0].network)}. It needs a little {gasSymbol} to pay network fees for both steps.
        </p>
      )}

      {moves.map((m, mi) => (
        <section key={m.vaultId} className="rounded-[16px] border border-steel bg-paper" aria-label={m.vaultName}>
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-steel px-5 py-4">
            <p className="text-[16px] text-ink">{m.vaultName}</p>
            <p className="num text-[12px] text-slate">
              {networkCopy(m.network)}
              {(() => {
                const v = plan.vaults.find((x) => x.id === m.vaultId);
                return v ? ` · ${withdrawalCopy(v)}` : "";
              })()}
            </p>
          </header>
          <ol className="divide-y divide-steel">
            {m.steps.map((s, si) => {
              const st = steps[`${mi}.${si}`] ?? { kind: "idle" };
              const prevOk = si === 0 || ["done", "skipped"].includes(steps[`${mi}.${si - 1}`]?.kind ?? "");
              const canSign = account && !wrongChain && !shortOfFunds && !noGas && prevOk && ["idle", "error"].includes(st.kind);
              const approve = s.type.includes("approve") ? decodeApprove(s.tx.data) : null;
              const exact = !!approve && approve.amount === BigInt(m.baseUnits);
              const addr = (a: string) => `${m.explorerUrl}/address/${a}`;
              const link = "hash" in st ? `${m.explorerUrl}/tx/${st.hash}` : null;
              return (
                <li key={si} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <span className="num pt-[2px] text-[12px] text-slate">{si + 1}</span>
                    <div>
                      <p className="text-[15px] text-ink">{stepTitle(s.type, m, exact)}</p>
                      <dl className="num mt-2 grid grid-cols-[72px_1fr] gap-x-3 gap-y-1 text-[12px]" title={`${m.baseUnits} base units`}>
                        {approve ? (
                          <>
                            <dt className="text-slate">TOKEN</dt>
                            <dd><a href={addr(s.tx.to)} target="_blank" rel="noreferrer" className="text-ink underline-offset-4 hover:underline">USDC {short(s.tx.to)}</a></dd>
                            <dt className="text-slate">SPENDER</dt>
                            <dd><a href={addr(approve.spender)} target="_blank" rel="noreferrer" className="text-ink underline-offset-4 hover:underline">{approve.spender.toLowerCase() === m.vaultAddress.toLowerCase() ? m.vaultName : "Unknown"} {short(approve.spender)}</a></dd>
                          </>
                        ) : (
                          <>
                            <dt className="text-slate">VAULT</dt>
                            <dd><a href={addr(s.tx.to)} target="_blank" rel="noreferrer" className="text-ink underline-offset-4 hover:underline">{m.vaultName} {short(s.tx.to)}</a></dd>
                          </>
                        )}
                      </dl>
                      {exact && <p className="mt-1 text-[12px] text-charcoal">This approval is limited to this deposit amount.</p>}
                      {st.kind === "confirm" && <p className="mt-1 text-[13px] text-charcoal">Confirm in your wallet.</p>}
                      {st.kind === "pending" && <p className="mt-1 text-[13px] text-charcoal">Waiting for {networkCopy(m.network)}.</p>}
                      {st.kind === "skipped" && <p className="mt-1 text-[13px] text-charcoal">Already allowed. Nothing to sign.</p>}
                      {st.kind === "reverted" && <p className="mt-1 text-[13px] text-alert">The network rejected this transaction.</p>}
                      {st.kind === "error" && <p className="mt-1 text-[13px] text-alert">{st.message}</p>}
                      {link && (
                        <a href={link} target="_blank" rel="noreferrer" className="num mt-1 inline-block text-[12px] text-ink underline underline-offset-4">
                          {st.kind === "done" ? "Confirmed" : "Sent"} · {short((st as { hash: string }).hash)} · View on explorer ↗
                        </a>
                      )}
                    </div>
                  </div>
                  {st.kind === "done" || st.kind === "skipped" ? (
                    <span className="num inline-flex items-center gap-2 self-start rounded-[6px] bg-volt px-2 py-1 text-[12px] text-ink sm:self-auto">✓ Done</span>
                  ) : (
                    <div className="flex flex-col items-start gap-1 sm:items-end">
                      <button type="button" disabled={!canSign} onClick={() => sign(mi, si, m)} className="btn btn-dark disabled:cursor-not-allowed disabled:opacity-40">
                        {st.kind === "confirm" || st.kind === "pending" ? "Signing" : st.kind === "error" || st.kind === "reverted" ? "Try again" : s.type.includes("approve") ? "Approve USDC" : s.type.includes("deposit") ? "Deposit USDC" : "Sign"}
                      </button>
                      {!canSign && st.kind === "idle" && (
                        <span className="text-[12px] text-slate">
                          {!account ? "Connect a wallet first." : wrongChain ? "Switch networks first." : shortOfFunds ? "Not enough USDC." : noGas ? `Not enough ${gasSymbol} for gas.` : "Signs after the step above."}
                        </span>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <footer className="flex flex-col gap-3 border-t border-steel pt-6 text-[14px] text-charcoal">
        {plan.plan.redemptions.map((r, k) => (
          <p key={k}>
            Next move: on <span className="num text-ink">{dayLabel(r.requestDate)}</span>, come back to sign a <span className="num text-ink">{formatUsdc(r.amount)}</span> USDC withdrawal for the payout it funds. Nothing happens automatically.
          </p>
        ))}
        <p className="num text-[12px] text-slate">
          Plan checked {plan.check.passed.length} of 8 · verified by Ebbryn{plan.meta.requestId ? ` · SERV request ${plan.meta.requestId.slice(0, 8)}...` : ""}
        </p>
        {allDone && (
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/plan" className="btn btn-soft">
              Back to plan
            </Link>
            <Link href="/setup" className="btn btn-dark">
              Start over
            </Link>
          </div>
        )}
      </footer>
    </div>
  );
}
