import recorded from "@/fixtures/serv-double-count.json";
import { checkPlan } from "@/lib/check";
import type { Plan, VaultInfo } from "@/lib/plan";
import { expandSchedule, type Payout } from "@/lib/schedule";

const PLAIN: Record<string, string> = {
  COVER_ONCE: "Every payout funded exactly once",
  LIQUID_COVER: "Enough cash kept ready",
  SUM: "Amounts add up",
  CAP: "Hard limit respected",
  CLOSED: "No closed vaults",
  TIMING: "Money back in time",
  REDEEM_LE_PARKED: "Can't withdraw more than parked",
  SHORTFALL: "No shortfall",
};

// Runs the real checks on the real recorded SERV output. Nothing on this card is typed by hand.
function runRecorded() {
  const i = recorded.inputs;
  const payouts = i.payouts as Payout[];
  return checkPlan({
    plan: recorded.plan as Plan,
    balance: i.balance,
    today: i.today,
    payouts,
    occurrences: expandSchedule(payouts, i.today, i.windowDays),
    vaults: i.vaults as VaultInfo[],
    limits: i.limits,
  });
}

export function CaughtMistake() {
  const result = runRecorded();
  const raw = recorded.rawOutput;

  return (
    <section id="caught" className="scroll-mt-8 bg-ink" aria-labelledby="caught-heading">
      <div className="container-page py-20 md:py-28">
        <p className="label text-white/55">Why code checks the model</p>
        <h2 id="caught-heading" className="display-section mt-5 max-w-[980px]" style={{ color: "rgba(255,255,255,0.5)" }}>
          We asked a model to plan payroll cash. <span className="text-paper">It counted payroll twice.</span>
        </h2>
        <p className="mt-5 max-w-[600px] text-[18px] leading-[27px]" style={{ color: "rgba(255,255,255,0.6)" }}>
          A real SERV answer from our testing, run through the same eight checks every Ebbryn plan goes through. It never reached a
          wallet.
        </p>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <figure className="rounded-[16px] bg-graphite p-6 md:p-8" style={{ boxShadow: "var(--shadow-graphite)" }}>
            <figcaption className="flex flex-wrap items-center justify-between gap-2">
              <span className="num text-[12px] uppercase tracking-[0.24px] text-white/55">What SERV said</span>
              <span className="num text-[12px] text-white/55">{recorded.label}</span>
            </figcaption>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-b border-white/10 pb-6">
              <div>
                <dt className="text-[13px] text-white/55">Keep ready</dt>
                <dd className="num mt-1 text-[28px] text-paper">{raw.liquid.toLocaleString("en-US")}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-white/55">Park</dt>
                <dd className="num mt-1 text-[28px] text-paper">{raw.parked.toLocaleString("en-US")}</dd>
              </div>
            </dl>
            <ol className="mt-6 flex flex-col gap-4">
              {raw.reasons.map((r, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-[23px] text-white/80">
                  <span className="num pt-[2px] text-[12px] text-white/55">{String(i + 1).padStart(2, "0")}</span>
                  <q className="[quotes:none]">{r}</q>
                </li>
              ))}
            </ol>
            <p className="num mt-6 text-[12px] text-white/55">{recorded.model}</p>
          </figure>

          <figure className="rounded-[16px] bg-graphite p-6 md:p-8" style={{ boxShadow: "var(--shadow-graphite)" }}>
            <figcaption className="flex flex-wrap items-center justify-between gap-2">
              <span className="num text-[12px] uppercase tracking-[0.24px] text-white/55">What Ebbryn&apos;s checks found</span>
              <span className="num text-[12px] text-white/55">
                {result.passed.length} of 8 passed
              </span>
            </figcaption>
            <ul className="mt-6 flex flex-col gap-3">
              {result.failures.map((f, i) => (
                <li key={i} className="rounded-[12px] bg-white/[0.04] p-4" style={{ boxShadow: "inset 0 0 0 1px rgba(179,38,30,0.6)" }}>
                  <p className="flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-[6px] bg-alert text-[12px] text-paper" aria-hidden="true">
                      ×
                    </span>
                    <span className="text-[15px] text-paper">{PLAIN[f.code] ?? f.code}</span>
                    <span className="num ml-auto text-[11px] text-white/55">{f.code}</span>
                  </p>
                  <p className="mt-2 text-[14px] leading-[21px] text-white/70">{f.detail}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-white/55">
              {result.passed.map((c) => (
                <span key={c} className="inline-flex items-center gap-2">
                  <span className="h-[6px] w-4 rounded-full bg-volt" aria-hidden="true" />
                  {PLAIN[c] ?? c}
                </span>
              ))}
            </p>
            <p className="mt-6 border-t border-white/10 pt-6 text-[16px] text-paper">
              {result.ok ? "Passed." : "Locked. Nothing can be signed until a plan passes."}
            </p>
          </figure>
        </div>
      </div>
    </section>
  );
}
