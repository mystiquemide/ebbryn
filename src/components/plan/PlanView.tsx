"use client";

import { useState } from "react";
import { CHECK_PLAIN } from "@/lib/checkCopy";
import type { PlanInputs } from "@/lib/input";
import { WINDOW_DAYS } from "@/lib/input";
import { CHECK_CODES, type CheckResult, type Plan, type VaultInfo } from "@/lib/plan";
import { expandSchedule } from "@/lib/schedule";
import { buildTimeline } from "@/lib/timeline";
import { formatUsdc } from "@/lib/units";
import { withdrawalCopy } from "@/lib/vaultCopy";
import { TideChart } from "./TideChart";

export type PlanResult = {
  inputs: PlanInputs;
  plan: Plan;
  check: CheckResult;
  meta: { requestId: string | null; model: string; features: string[] };
  signature: string | null;
  vaults: VaultInfo[];
  attempts?: number;
};

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function ProofStrip({ meta }: { meta: PlanResult["meta"] }) {
  const [copied, setCopied] = useState(false);
  return (
    <p className="num flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-slate">
      <span>SERV {meta.model}</span>
      {meta.features.map((f) => (
        <span key={f}>· {f === "Shadow Agent" ? "Shadow Agent on" : f}</span>
      ))}
      {meta.requestId && (
        <>
          <span>· request {meta.requestId.slice(0, 8)}...</span>
          <button
            type="button"
            className="rounded-[6px] bg-cloud px-2 py-1 text-ink hover:bg-steel"
            onClick={() => {
              navigator.clipboard?.writeText(meta.requestId!).then(
                () => setCopied(true),
                () => setCopied(false),
              );
            }}
          >
            {copied ? "Copied" : "Copy id"}
          </button>
        </>
      )}
    </p>
  );
}

export function PlanView({ result, children }: { result: PlanResult; children?: React.ReactNode }) {
  const { inputs, plan, check, vaults, meta } = result;
  const occurrences = expandSchedule(inputs.payouts, inputs.today, WINDOW_DAYS);
  const days = buildTimeline(plan, occurrences, vaults, inputs.today, WINDOW_DAYS);
  const parkedTotal = plan.parked.reduce((s, p) => s + p.amount, 0);
  const pct = (v: number) => `${Math.round((v / inputs.balance) * 100)}%`;
  const vaultById = new Map(vaults.map((v) => [v.id, v]));
  const occById = new Map(occurrences.map((o) => [o.id, o]));
  const failedCodes = new Set(check.failures.map((f) => f.code));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label">{check.ok ? "Your plan" : "Plan rejected"}</p>
          <span
            className="num inline-flex items-center gap-2 rounded-[6px] px-2 py-1 text-[12px]"
            style={check.ok ? { background: "#bff660", color: "#18181b" } : { background: "#b3261e", color: "#ffffff" }}
          >
            {check.ok ? `Checks ${check.passed.length} of 8 passed` : `${failedCodes.size} failed, ${check.passed.length} passed`}
          </span>
        </div>
        <h1 className="display-section text-ink">
          {check.ok ? (
            <>
              <span className="tabular-nums">{formatUsdc(plan.liquid)}</span> ready. <span className="tabular-nums">{formatUsdc(parkedTotal)}</span> earning.
            </>
          ) : (
            "This plan didn't pass."
          )}
        </h1>
      </header>

      <TideChart days={days} balance={inputs.balance} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="rounded-[16px] border border-steel bg-paper p-6" aria-labelledby="split-h">
          <h2 id="split-h" className="num text-[12px] uppercase tracking-[0.24px] text-charcoal">
            Where it goes
          </h2>
          <dl className="mt-4 flex flex-col divide-y divide-steel">
            <div className="flex items-baseline justify-between gap-3 py-3">
              <dt className="text-[15px] text-ink">Wallet, ready</dt>
              <dd className="num text-[15px] text-ink">
                {formatUsdc(plan.liquid)} <span className="text-slate">{pct(plan.liquid)}</span>
              </dd>
            </div>
            {plan.parked.map((p) => {
              const v = vaultById.get(p.vaultId);
              return (
                <div key={p.vaultId} className="flex items-baseline justify-between gap-3 py-3">
                  <dt>
                    <p className="text-[15px] text-ink">{v?.name ?? p.vaultId}</p>
                    {v && <p className="text-[13px] text-slate">{withdrawalCopy(v)}</p>}
                  </dt>
                  <dd className="num text-[15px] text-ink">
                    {formatUsdc(p.amount)} <span className="text-slate">{pct(p.amount)}</span>
                  </dd>
                </div>
              );
            })}
          </dl>
          {plan.redemptions.length > 0 && (
            <>
              <h3 className="num mt-5 text-[12px] uppercase tracking-[0.24px] text-charcoal">Scheduled</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {plan.redemptions.map((r, k) => {
                  const funds = r.funds.map((id) => occById.get(id)).filter(Boolean);
                  return (
                    <li key={k} className="text-[14px] text-charcoal">
                      <span className="num text-ink">{dayLabel(r.requestDate)}</span> withdraw <span className="num text-ink">{formatUsdc(r.amount)}</span>
                      {funds.length > 0 && ` for the ${funds.map((o) => `${dayLabel(o!.date)} ${o!.label.toLowerCase()}`).join(", ")}`}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <section className="rounded-[16px] bg-graphite p-6 text-paper" style={{ boxShadow: "var(--shadow-graphite)" }} aria-labelledby="why-h">
          <h2 id="why-h" className="num text-[12px] uppercase tracking-[0.24px] text-white/55">
            Why, in SERV&apos;s words
          </h2>
          <ol className="mt-4 flex flex-col gap-4">
            {plan.reasons.map((r, k) => (
              <li key={k} className="flex gap-3">
                <span className="num pt-[2px] text-[12px] text-white/55">{String(k + 1).padStart(2, "0")}</span>
                <div>
                  <p className="text-[15px] leading-[22px] text-white/90">{r.text}</p>
                  <p className="mt-1 text-[12px] text-white/50">Rule: {r.rule.replace(/^"|"$/g, "")}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section aria-labelledby="checks-h">
        <h2 id="checks-h" className="num text-[12px] uppercase tracking-[0.24px] text-charcoal">
          Checks Ebbryn ran on this plan
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHECK_CODES.map((code) => {
            const failed = failedCodes.has(code);
            const details = check.failures.filter((f) => f.code === code).map((f) => f.detail);
            return (
              <li
                key={code}
                className="rounded-[12px] bg-paper p-4"
                style={{ boxShadow: failed ? "inset 0 0 0 1px #b3261e" : "inset 0 0 0 1px #d4d4d8" }}
              >
                <p className="flex items-center gap-2">
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-[6px] text-[12px]"
                    style={failed ? { background: "#b3261e", color: "#ffffff" } : { background: "#bff660", color: "#18181b" }}
                    aria-hidden="true"
                  >
                    {failed ? "×" : "✓"}
                  </span>
                  <span className="text-[14px] text-ink">{CHECK_PLAIN[code].title}</span>
                </p>
                <p className="mt-2 text-[13px] leading-[19px] text-slate">{failed ? details.join(" ") : CHECK_PLAIN[code].meaning}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-col gap-5 border-t border-steel pt-6">
        <ProofStrip meta={meta} />
        {children}
      </div>
    </div>
  );
}
