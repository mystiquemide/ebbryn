"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Move } from "@/app/api/moves/route";
import { PLAN_KEY } from "@/lib/storageKeys";
import { formatUsdc } from "@/lib/units";
import { networkCopy, withdrawalCopy } from "@/lib/vaultCopy";
import {
  connectWallet,
  hasWallet,
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

function stepTitle(type: string, move: Move): string {
  if (type.includes("approve")) return `Allow ${move.vaultName} to use ${formatUsdc(move.amount)} USDC`;
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
          const [bal, allowance] = await Promise.all([
            readTokenBalance(first.chainId, first.asset, owner, first.decimals).catch(() => null),
            readAllowance(first.chainId, first.asset, owner, first.vaultAddress).catch(() => null),
          ]);
          setBalance(bal);
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

      <section className="flex flex-col gap-3 rounded-[16px] bg-cloud p-5 sm:flex-row sm:items-center sm:justify-between" style={{ boxShadow: "var(--shadow-cloud)" }} aria-label="Wallet">
        {account ? (
          <p className="text-[15px] text-ink">
            Wallet <span className="num">{short(account)}</span>
            {moves[0] && (
              <span className="text-slate">
                {" "}
                · {wrongChain ? "on another network" : networkCopy(moves[0].network)}
                {balance !== null && ` · ${formatUsdc(balance)} USDC`}
              </span>
            )}
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
          This wallet has {formatUsdc(balance!)} IXS test USDC on {networkCopy(moves[0].network)}. You need {formatUsdc(need)} to sign the deposit.
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
              const canSign = account && !wrongChain && !shortOfFunds && prevOk && ["idle", "error"].includes(st.kind);
              const link = "hash" in st ? `${m.explorerUrl}/tx/${st.hash}` : null;
              return (
                <li key={si} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <span className="num pt-[2px] text-[12px] text-slate">{si + 1}</span>
                    <div>
                      <p className="text-[15px] text-ink">{stepTitle(s.type, m)}</p>
                      <p className="num mt-1 text-[12px] text-slate" title={`${m.baseUnits} base units`}>
                        Contract {short(s.tx.to)} {s.tx.to.toLowerCase() === m.asset.toLowerCase() ? "(USDC)" : "(vault)"}
                      </p>
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
                        {st.kind === "confirm" || st.kind === "pending" ? "Signing" : st.kind === "error" || st.kind === "reverted" ? "Try again" : "Sign"}
                      </button>
                      {!canSign && st.kind === "idle" && (
                        <span className="text-[12px] text-slate">
                          {!account ? "Connect a wallet first." : wrongChain ? "Switch networks first." : shortOfFunds ? "Not enough USDC." : "Signs after the step above."}
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
            Next: <span className="num text-ink">{dayLabel(r.requestDate)}</span>, withdraw <span className="num text-ink">{formatUsdc(r.amount)}</span> ahead of the payout it funds.
          </p>
        ))}
        <p className="num text-[12px] text-slate">
          Plan checked {plan.check.passed.length} of 8 · signed by Ebbryn{plan.meta.requestId ? ` · SERV request ${plan.meta.requestId.slice(0, 8)}...` : ""}
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
