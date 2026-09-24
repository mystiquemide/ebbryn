"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { InputError, parsePlanInputs, WINDOW_DAYS } from "@/lib/input";
import type { VaultInfo } from "@/lib/plan";
import { dailySpend, expandSchedule, type Repeat } from "@/lib/schedule";
import { INPUTS_KEY, SETUP_KEY as STORAGE_KEY } from "@/lib/storageKeys";
import { slug, template, type SetupState } from "@/lib/templates";
import { formatUsdc } from "@/lib/units";
import { connectWallet, readTokenBalance, WalletError } from "@/lib/wallet";
import { Arrow } from "../SiteNav";



type Kind = "payroll" | "fleet" | "blank";

const REPEAT_LABEL: Record<Repeat, string> = { none: "One time", daily: "Every day", semimonthly: "1st and 15th" };

const todayUtc = () => new Date().toISOString().slice(0, 10);

function num(v: string): number | null {
  const n = Number(v.replace(/,/g, "").trim());
  return v.trim() !== "" && Number.isFinite(n) ? n : null;
}

function readSaved(): { kind: Kind; state: SetupState } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { kind: Kind; state: SetupState }) : null;
  } catch {
    return null;
  }
}

function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => React.ReactNode }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[14px] text-ink">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-[13px] text-slate">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full min-w-0 rounded-[12px] border bg-paper px-3 py-2.5 text-[15px] text-ink outline-none focus:border-ink";

export function SetupForm() {
  const router = useRouter();
  const [today] = useState(todayUtc);
  const [kind, setKind] = useState<Kind>("payroll");
  const [state, setState] = useState<SetupState>(() => template("payroll", todayUtc()));
  const [edited, setEdited] = useState(false);
  const [wallet, setWallet] = useState<{ status: "idle" | "busy" | "error"; message?: string }>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Restore the visitor's last setup from this browser, if any.
  useEffect(() => {
    const saved = readSaved();
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
      setKind(saved.kind);
      setState(saved.state);
      setEdited(true);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ kind, state }));
    } catch {
      /* storage can be blocked; the form still works */
    }
  }, [kind, state]);

  const update = (fn: (s: SetupState) => SetupState) => {
    setState(fn);
    setEdited(true);
    setError(null);
  };

  const pick = (k: Kind) => {
    setKind(k);
    setState(template(k, today));
    setEdited(false);
    setError(null);
  };

  const summary = useMemo(() => {
    const balance = num(state.balance);
    const payouts = state.payouts
      .map((p) => ({ ...p, amount: num(p.amount) }))
      .filter((p): p is typeof p & { amount: number } => p.amount !== null && p.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(p.date));
    let occ: ReturnType<typeof expandSchedule> = [];
    try {
      occ = expandSchedule(payouts, today, WINDOW_DAYS);
    } catch {
      occ = [];
    }
    const rows = payouts.map((p) => {
      const mine = occ.filter((o) => o.payoutId === p.id);
      return { label: p.label || "Unnamed payout", count: mine.length, total: mine.reduce((s, o) => s + o.amount, 0) };
    });
    const due = rows.reduce((s, r) => s + r.total, 0);
    const pct = num(state.limits.maxParkedPct);
    const maxPark = balance !== null && pct !== null ? (balance * pct) / 100 : null;
    const bufferDays = num(state.limits.minLiquidDays);
    const buffer = bufferDays !== null ? dailySpend(payouts) * bufferDays : null;
    return { balance, rows, due, maxPark, pct, bufferDays, buffer, short: balance !== null ? due - balance : null };
  }, [state, today]);

  const useWalletBalance = async () => {
    setWallet({ status: "busy", message: "Connecting to your wallet." });
    try {
      const account = await connectWallet();
      setWallet({ status: "busy", message: "Reading your IXS test USDC balance." });
      const res = await fetch("/api/vaults");
      const { vaults } = (await res.json()) as { vaults?: VaultInfo[] };
      const open = vaults?.find((v) => v.acceptsDeposits);
      if (!open) throw new WalletError("No IXS vault is open right now, so there's no test USDC balance to read.");
      const bal = await readTokenBalance(open.chainId, open.asset, account, open.decimals);
      update((s) => ({ ...s, balance: bal.toLocaleString("en-US", { maximumFractionDigits: 2 }) }));
      setWallet({
        status: "idle",
        message: `Read ${formatUsdc(bal)} USDC for ${account.slice(0, 6)}...${account.slice(-4)} on ${open.network.replace("-", " ")}.`,
      });
    } catch (e) {
      setWallet({ status: "error", message: e instanceof WalletError ? e.message : "Couldn't read the wallet balance. Type it in instead." });
    }
  };

  const submit = () => {
    const body = {
      balance: num(state.balance),
      payouts: state.payouts.map((p) => ({ ...p, amount: num(p.amount) })),
      rules: state.rules,
      limits: { maxParkedPct: num(state.limits.maxParkedPct), minLiquidDays: num(state.limits.minLiquidDays) },
    };
    try {
      const inputs = parsePlanInputs(body, today);
      localStorage.setItem(INPUTS_KEY, JSON.stringify(inputs));
      setLeaving(true);
      router.push("/plan");
    } catch (e) {
      setError(e instanceof InputError ? e.message : "Something in the form isn't right. Check the fields and try again.");
    }
  };

  const addPayout = () =>
    update((s) => {
      const taken = new Set(s.payouts.map((p) => p.id));
      return { ...s, payouts: [...s.payouts, { id: slug("payout", taken), label: "", amount: "", date: today, repeat: "none" }] };
    });

  const setPayout = (i: number, patch: Partial<SetupState["payouts"][number]>) =>
    update((s) => {
      const payouts = s.payouts.map((p, j) => (j === i ? { ...p, ...patch } : p));
      if (patch.label !== undefined) {
        const taken = new Set(payouts.filter((_, j) => j !== i).map((p) => p.id));
        payouts[i] = { ...payouts[i], id: slug(patch.label || "payout", taken) };
      }
      return { ...s, payouts };
    });

  const canPlan = summary.balance !== null && state.payouts.length > 0;

  const cta = (extra: string) => (
    <>
      <button type="button" onClick={submit} disabled={!canPlan || leaving} className={`btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 ${extra}`}>
        {leaving ? "Planning your cash..." : "Plan my cash"}
        {!leaving && <Arrow />}
      </button>
    </>
  );

  return (
    <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="flex flex-col gap-10">
        <header className="flex flex-col gap-5">
          <Link href="/" className="btn btn-soft self-start">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M13 8H4M7.5 4.5 4 8l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to home
          </Link>
          <p className="label">Step 1 of 3</p>
          <h1 className="display-section text-ink">Tell Ebbryn what&apos;s coming up.</h1>
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Start from">
            <span className="mr-2 text-[14px] text-slate">Start from</span>
            {(
              [
                ["payroll", "Payroll team"],
                ["fleet", "Agent fleet"],
                ["blank", "Blank"],
              ] as [Kind, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={kind === k}
                onClick={() => pick(k)}
                className="btn btn-soft gap-2"
                style={kind === k ? { background: "#18181b", color: "#ffffff" } : undefined}
              >
                <span className="h-3 w-3 rounded-[4px]" style={{ background: kind === k ? "#94faf0" : "#d4d4d8" }} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          {kind !== "blank" && !edited && <p className="text-[13px] text-slate">Starting template. Edit anything.</p>}
        </header>

        <section className="flex flex-col gap-4" aria-labelledby="balance-h">
          <h2 id="balance-h" className="feature-heading text-ink">
            Balance
          </h2>
          <Field label="USDC you hold for payouts" hint={wallet.message}>
            {(id) => (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <input
                    id={id}
                    inputMode="decimal"
                    value={state.balance}
                    onChange={(e) => update((s) => ({ ...s, balance: e.target.value }))}
                    className={`num text-right ${inputCls} max-w-[200px]`}
                    style={{ borderColor: state.balance && num(state.balance) === null ? "#b3261e" : "#d4d4d8" }}
                  />
                  <span className="text-charcoal">USDC</span>
                </div>
                <button type="button" onClick={useWalletBalance} disabled={wallet.status === "busy"} className="btn btn-dark">
                  {wallet.status === "busy" ? "Reading wallet" : "Use wallet balance"}
                </button>
              </div>
            )}
          </Field>
          {wallet.status === "error" && <p className="text-[13px] text-alert">{wallet.message}</p>}
        </section>

        <section className="flex flex-col gap-4" aria-labelledby="payouts-h">
          <h2 id="payouts-h" className="feature-heading text-ink">
            Payouts
          </h2>
          {state.payouts.length === 0 ? (
            <p className="rounded-[16px] bg-cloud p-6 text-[15px] text-charcoal">
              Add your first payout. Payroll, rent, agent top-ups, anything with a date.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {state.payouts.map((p, i) => {
                const badAmount = p.amount !== "" && (num(p.amount) === null || (num(p.amount) ?? 0) <= 0);
                return (
                  <li key={i} className="grid gap-3 rounded-[16px] bg-cloud p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)_auto] sm:items-end">
                    <label className="flex min-w-0 flex-col gap-1 text-[12px] text-slate">
                      Name
                      <input value={p.label} onChange={(e) => setPayout(i, { label: e.target.value })} placeholder="Contractor payroll" className={inputCls} style={{ borderColor: "#d4d4d8" }} />
                    </label>
                    <label className="flex min-w-0 flex-col gap-1 text-[12px] text-slate">
                      Amount (USDC)
                      <input
                        inputMode="decimal"
                        value={p.amount}
                        onChange={(e) => setPayout(i, { amount: e.target.value })}
                        className={`num text-right ${inputCls}`}
                        style={{ borderColor: badAmount ? "#b3261e" : "#d4d4d8" }}
                      />
                    </label>
                    <label className="flex min-w-0 flex-col gap-1 text-[12px] text-slate">
                      First date
                      <input type="date" value={p.date} min={today} onChange={(e) => setPayout(i, { date: e.target.value })} className={`num ${inputCls}`} style={{ borderColor: "#d4d4d8" }} />
                    </label>
                    <label className="flex min-w-0 flex-col gap-1 text-[12px] text-slate">
                      Repeats
                      <select value={p.repeat} onChange={(e) => setPayout(i, { repeat: e.target.value as Repeat })} className={inputCls} style={{ borderColor: "#d4d4d8" }}>
                        {(Object.keys(REPEAT_LABEL) as Repeat[]).map((r) => (
                          <option key={r} value={r}>
                            {REPEAT_LABEL[r]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => update((s) => ({ ...s, payouts: s.payouts.filter((_, j) => j !== i) }))}
                      className="btn btn-soft bg-paper sm:col-span-2 sm:justify-self-start xl:col-span-1"
                      aria-label={`Remove ${p.label || "payout"}`}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div>
            <button type="button" onClick={addPayout} disabled={state.payouts.length >= 20} className="btn btn-soft">
              + Add payout
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-4" aria-labelledby="rules-h">
          <h2 id="rules-h" className="feature-heading text-ink">
            Your rules
          </h2>
          <Field label="In plain English. SERV weighs these when it plans." hint={`${state.rules.length} / 1200`}>
            {(id) => (
              <textarea
                id={id}
                rows={4}
                maxLength={1200}
                value={state.rules}
                onChange={(e) => update((s) => ({ ...s, rules: e.target.value }))}
                placeholder="Never be short for payroll. Keep 3 days of agent spend ready."
                className={`${inputCls} leading-[22px]`}
                style={{ borderColor: "#d4d4d8" }}
              />
            )}
          </Field>
        </section>

        <section className="flex flex-col gap-4" aria-labelledby="limits-h">
          <h2 id="limits-h" className="feature-heading text-ink">
            Hard limits
          </h2>
          <p className="flex items-center gap-3 rounded-[12px] px-4 py-3 text-[14px] text-ink" style={{ background: "rgba(148,250,240,0.25)", boxShadow: "inset 0 0 0 1px #94faf0" }}>
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[6px] bg-aqua" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 16 16"><path d="M8 3.5v5M8 11.5v.5" stroke="#18181b" strokeWidth="2" strokeLinecap="round" /></svg>
            </span>
            Ebbryn&apos;s checks enforce these, whatever the rules say.
          </p>
          <div className="flex flex-wrap gap-6">
            <Field label="Park at most">
              {(id) => (
                <div className="flex items-center gap-2">
                  <input id={id} inputMode="numeric" value={state.limits.maxParkedPct} onChange={(e) => update((s) => ({ ...s, limits: { ...s.limits, maxParkedPct: e.target.value } }))} className={`num text-right ${inputCls} max-w-[90px]`} style={{ borderColor: "#d4d4d8" }} />
                  <span className="text-charcoal">% of balance</span>
                </div>
              )}
            </Field>
            <Field label="Extra days of daily spend kept ready">
              {(id) => (
                <div className="flex items-center gap-2">
                  <input id={id} inputMode="numeric" value={state.limits.minLiquidDays} onChange={(e) => update((s) => ({ ...s, limits: { ...s.limits, minLiquidDays: e.target.value } }))} className={`num text-right ${inputCls} max-w-[90px]`} style={{ borderColor: "#d4d4d8" }} />
                  <span className="text-charcoal">days</span>
                </div>
              )}
            </Field>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-steel pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-slate">
            {leaving ? "SERV is evaluating your payouts and rules. Usually 40 to 70 seconds." : canPlan ? "SERV plans usually take 40 to 70 seconds." : "Add a balance and at least one payout to plan."}
          </p>
          <div className="sm:w-[240px]">{cta("")}</div>
        </div>
        {error && <p className="-mt-6 rounded-[12px] p-3 text-[13px] text-paper" style={{ background: "#b3261e" }}>{error}</p>}
      </div>

      <aside className="lg:sticky lg:top-6">
        <div className="rounded-[16px] bg-graphite p-6 text-paper" style={{ boxShadow: "var(--shadow-graphite)" }}>
          <p className="num text-[12px] uppercase tracking-[0.24px] text-white/55">Next {WINDOW_DAYS} days</p>
          <dl className="mt-5 flex flex-col gap-3 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-white/70">Balance</dt>
              <dd className="num">{summary.balance !== null ? formatUsdc(summary.balance) : "Not set"}</dd>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-3">
              <dt className="text-white/70">Due</dt>
              <dd className="num">{formatUsdc(summary.due)}</dd>
            </div>
            {summary.rows.map((r, i) => (
              <div key={i} className="flex justify-between pl-3 text-[13px] text-white/60">
                <dt className="truncate pr-3">
                  {r.label} × {r.count}
                </dt>
                <dd className="num">{formatUsdc(r.total)}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-white/10 pt-3">
              <dt className="text-white/70">Buffer kept ready{summary.bufferDays !== null ? `: ${summary.bufferDays} days` : ""}</dt>
              <dd className="num">{summary.buffer !== null ? formatUsdc(summary.buffer) : "Not set"}</dd>
            </div>
            <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
              <div className="flex justify-between">
                <dt className="text-white/70">Maximum parking allowed</dt>
                <dd className="num">{summary.maxPark !== null ? formatUsdc(summary.maxPark) : "Not set"}</dd>
              </div>
              {summary.pct !== null && <p className="text-[12px] text-white/50">Capped by your {summary.pct}% hard limit.</p>}
            </div>
          </dl>
          {summary.short !== null && summary.short > 0 && (
            <p className="mt-5 rounded-[12px] p-3 text-[13px] leading-[19px]" style={{ background: "rgba(179,38,30,0.18)", boxShadow: "inset 0 0 0 1px rgba(179,38,30,0.6)" }}>
              Payouts in the next {WINDOW_DAYS} days are {formatUsdc(summary.short)} more than your balance. Ebbryn won&apos;t park anything.
            </p>
          )}
          {cta("mt-6")}
          {!canPlan && <p className="mt-3 text-[13px] text-white/55">Add a balance and at least one payout to plan.</p>}
          {error && <p className="mt-3 rounded-[12px] p-3 text-[13px] text-paper" style={{ background: "rgba(179,38,30,0.35)" }}>{error}</p>}
        </div>
      </aside>
    </div>
  );
}
