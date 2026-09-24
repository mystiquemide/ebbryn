"use client";

import { WithdrawalReminder } from "@/components/WithdrawalReminder";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import recorded from "@/fixtures/serv-double-count.json";
import { checkPlan } from "@/lib/check";
import type { PlanInputs } from "@/lib/input";
import type { Plan, VaultInfo } from "@/lib/plan";
import { expandSchedule, type Payout } from "@/lib/schedule";
import { INPUTS_KEY, PLAN_KEY } from "@/lib/storageKeys";
import { Arrow } from "../SiteNav";
import { PlanView, type PlanResult } from "./PlanView";


type State =
  | { kind: "loading" }
  | { kind: "no-inputs" }
  | { kind: "planning"; started: number }
  | { kind: "result"; result: PlanResult; cached: boolean }
  | { kind: "rate"; until: number }
  | { kind: "error"; message: string };

function recordedResult(): PlanResult {
  const i = recorded.inputs;
  const payouts = i.payouts as Payout[];
  const vaults = i.vaults as VaultInfo[];
  const plan = recorded.plan as Plan;
  const inputs: PlanInputs = { balance: i.balance, today: i.today, payouts, rules: i.rules, limits: i.limits };
  const check = checkPlan({ plan, ...inputs, occurrences: expandSchedule(payouts, i.today, i.windowDays), vaults });
  return { inputs, plan, check, vaults, signature: null, meta: { requestId: null, model: recorded.model, features: ["Kronos", "Multipath", "Shadow Agent", "strict JSON schema"] } };
}

function readInputs(): PlanInputs | null {
  try {
    const raw = localStorage.getItem(INPUTS_KEY);
    return raw ? (JSON.parse(raw) as PlanInputs) : null;
  } catch {
    return null;
  }
}

function Planning({ started }: { started: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((now - started) / 1000));
  return (
    <div className="flex flex-col gap-6 py-6">
      <p className="label">Planning</p>
      <h1 className="display-section text-ink" role="status">
        Planning against your rules.
      </h1>
      <div className="rounded-[16px] bg-cloud p-6" style={{ boxShadow: "var(--shadow-cloud)" }}>
        <svg viewBox="0 0 1000 120" className="h-auto w-full" aria-hidden="true">
          <line x1="0" x2="1000" y1="60" y2="60" stroke="#d4d4d8" />
          <path className="tide-draw" d="M0 60 C 120 60, 160 100, 260 100 S 400 60, 500 60 S 640 100, 740 100 S 880 60, 1000 60" fill="none" stroke="url(#sw)" strokeWidth="3" />
          <defs>
            <linearGradient id="sw" x1="0" x2="1">
              <stop offset="0.52" stopColor="#07cddf" />
              <stop offset="1" stopColor="#9eed15" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <p className="text-[16px] text-charcoal">
        <span className="num text-ink" aria-live="off">
          {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}
        </span>{" "}
        elapsed. SERV is weighing your payouts and rules, then Ebbryn runs its 8 checks. Usually under 2 minutes.
      </p>
    </div>
  );
}

function Countdown({ until, onDone }: { until: number; onDone: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil((until - now) / 1000));
  return (
    <div className="flex flex-col gap-5 py-6">
      <p className="label">Paused</p>
      <h1 className="display-section text-ink">Planning is paused for a few minutes.</h1>
      <p className="max-w-[560px] text-[16px] text-charcoal">
        Ebbryn limits how often each visitor can plan, to protect shared SERV credits.{" "}
        {left > 0 ? (
          <>
            Try again in <span className="num text-ink">{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</span>.
          </>
        ) : (
          "You can plan again now."
        )}
      </p>
      <div className="flex gap-3">
        <button type="button" className="btn btn-dark" disabled={left > 0} onClick={onDone}>
          Try again
        </button>
        <Link href="/setup" className="btn btn-soft">
          Change inputs
        </Link>
      </div>
    </div>
  );
}

export function PlanScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const showRecorded = params.get("case") === "recorded";
  const [state, setState] = useState<State>({ kind: "loading" });
  const ran = useRef(false);

  const run = useCallback(async () => {
    const inputs = readInputs();
    if (!inputs) return setState({ kind: "no-inputs" });
    setState({ kind: "planning", started: Date.now() });
    try {
      const res = await fetch("/api/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(inputs) });
      const body = await res.json().catch(() => ({}));
      if (res.status === 429) return setState({ kind: "rate", until: Date.now() + (Number(body.retryAfterSec) || 60) * 1000 });
      if (!res.ok) return setState({ kind: "error", message: body.error ?? "This plan didn't finish. Nothing was changed. Try again." });
      const result = body as PlanResult & { cached?: boolean };
      try {
        localStorage.setItem(PLAN_KEY, JSON.stringify(result));
      } catch {
        /* storage blocked: moves will ask to replan */
      }
      setState({ kind: "result", result, cached: !!result.cached });
    } catch {
      setState({ kind: "error", message: "Couldn't reach Ebbryn. Check your connection and try again. Nothing was changed." });
    }
  }, []);

  useEffect(() => {
    if (showRecorded || ran.current) return;
    ran.current = true;
    void run();
  }, [run, showRecorded]);

  if (showRecorded) {
    return (
      <div className="flex flex-col gap-6">
        <p className="rounded-[12px] px-4 py-3 text-[14px] text-ink" style={{ background: "rgba(148,250,240,0.25)", boxShadow: "inset 0 0 0 1px #94faf0" }}>
          {recorded.label}. Shown to explain the checks. Moves are always locked for it.
        </p>
        <PlanView result={recordedResult()}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[14px] text-slate">Moves stay locked until a plan passes.</p>
            <Link href="/plan" className="btn btn-dark">
              Back to my plan
            </Link>
          </div>
        </PlanView>
      </div>
    );
  }

  switch (state.kind) {
    case "loading":
      return <div className="min-h-[50vh]" aria-busy="true" />;
    case "no-inputs":
      return (
        <div className="flex flex-col gap-5 py-6">
          <p className="label">Step 2 of 3</p>
          <h1 className="display-section text-ink">No plan yet.</h1>
          <p className="text-[16px] text-charcoal">Start with your payouts and Ebbryn will plan around them.</p>
          <div>
            <Link href="/setup" className="btn btn-primary">
              Go to setup
              <Arrow />
            </Link>
          </div>
        </div>
      );
    case "planning":
      return <Planning started={state.started} />;
    case "rate":
      return <Countdown until={state.until} onDone={run} />;
    case "error":
      return (
        <div className="flex flex-col gap-5 py-6">
          <p className="label">Step 2 of 3</p>
          <h1 className="display-section text-ink">The plan didn&apos;t come through.</h1>
          <p className="max-w-[560px] rounded-[12px] p-4 text-[15px] text-ink" style={{ boxShadow: "inset 0 0 0 1px #b3261e" }}>
            {state.message}
          </p>
          <div className="flex gap-3">
            <button type="button" className="btn btn-dark" onClick={run}>
              Try again
            </button>
            <Link href="/setup" className="btn btn-soft">
              Change inputs
            </Link>
          </div>
        </div>
      );
    case "result": {
      const { result } = state;
      return (
        <PlanView result={result}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3">
              <Link href="/setup" className="btn btn-soft">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M13 8H4M7.5 4.5 4 8l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Change inputs
              </Link>
              <Link href="/plan?case=recorded" className="btn btn-soft">
                View a plan Ebbryn rejected
              </Link>
            </div>
            {result.check.ok && result.signature ? (
              <button type="button" className="btn btn-primary" onClick={() => router.push("/moves")}>
                Review moves
                <Arrow />
              </button>
            ) : (
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <button type="button" className="btn btn-dark" onClick={run}>
                  Try again
                </button>
                <p className="text-[13px] text-slate">Moves stay locked until a plan passes.</p>
              </div>
            )}
          </div>
          {result.check.ok && result.signature && (
            <WithdrawalReminder plan={result.plan} vaults={result.vaults} note="Moves re-checks live IXS vault state before building anything." />
          )}
          {state.cached && <p className="text-[12px] text-slate">These inputs match a plan made in the last 10 minutes, so Ebbryn reused that plan instead of asking SERV again.</p>}
        </PlanView>
      );
    }
  }
}
