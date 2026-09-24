import real from "@/fixtures/serv-plan-payroll.json";
import { checkPlan } from "@/lib/check";
import type { Plan, VaultInfo } from "@/lib/plan";
import { daysBetween, expandSchedule, type Payout } from "@/lib/schedule";
import { formatUsdc } from "@/lib/units";

// Everything on these cards comes from one real SERV plan (see the fixture) and is re-checked at render.
function load() {
  const i = real.inputs;
  const payouts = i.payouts as Payout[];
  const occurrences = expandSchedule(payouts, i.today, i.windowDays);
  const vaults = i.vaults as VaultInfo[];
  const plan = real.plan as Plan;
  const check = checkPlan({ plan, balance: i.balance, today: i.today, payouts, occurrences, vaults, limits: i.limits });
  return { i, payouts, occurrences, vaults, plan, check };
}

const day = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const short = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).toUpperCase();

function CardFrame({ title, children, footer }: { title: string; children: React.ReactNode; footer: string }) {
  return (
    <figure data-reveal className="overflow-hidden rounded-[16px] border border-steel bg-paper" style={{ boxShadow: "var(--shadow-cloud)" }}>
      <figcaption className="flex items-center justify-between border-b border-steel px-5 py-3">
        <span className="num text-[12px] uppercase tracking-[0.24px] text-charcoal">{title}</span>
        <span className="num text-[12px] text-slate">{real.label}</span>
      </figcaption>
      <div className="p-5">{children}</div>
      <p className="num border-t border-steel bg-cloud px-5 py-3 text-[12px] text-slate">{footer}</p>
    </figure>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: "ready" | "parked" | "due" }) {
  const styles = {
    ready: { background: "#f4f4f5", color: "#18181b" },
    parked: { background: "#94faf0", color: "#18181b" },
    due: { background: "#27272a", color: "#ffffff" },
  }[tone];
  return (
    <span className="num inline-flex items-center rounded-[6px] px-2 py-1 text-[12px] leading-none" style={styles}>
      {children}
    </span>
  );
}

export function PayrollRunway() {
  const { i, occurrences, vaults, plan, check } = load();
  const payrolls = occurrences.filter((o) => o.payoutId === "payroll");
  const parked = plan.parked[0];
  const vault = vaults.find((v) => v.id === parked.vaultId);
  const redemption = plan.redemptions[0];
  const end = payrolls[payrolls.length - 1].date;
  const span = daysBetween(i.today, end);
  const pos = (d: string) => `${(daysBetween(i.today, d) / span) * 100}%`;
  const fundedByRedemption = new Set(redemption.funds);

  return (
    <CardFrame title="Payroll runway" footer={`${check.passed.length} of 8 checks passed · SERV request ${real.requestId.slice(0, 8)}`}>
      <p className="num text-[12px] text-slate">{short(i.today)} · TODAY</p>
      <p className="num mt-1 text-[28px] leading-none text-ink">
        {formatUsdc(i.balance)} <span className="text-[14px] text-slate">USDC</span>
      </p>

      <div className="mt-6 grid gap-5">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Pill tone="ready">READY {formatUsdc(plan.liquid)}</Pill>
            <span className="text-[12px] text-slate">in your wallet</span>
          </div>
          <div className="relative h-2 rounded-full bg-cloud">
            <div className="grow-x absolute inset-y-0 left-0 rounded-full bg-ink" style={{ width: "100%" }} />
          </div>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Pill tone="parked">PARKED {formatUsdc(parked.amount)}</Pill>
            <span className="text-[12px] text-slate">{vault?.name}</span>
          </div>
          <div className="relative h-2 rounded-full bg-cloud">
            <div className="grow-x absolute inset-y-0 left-0 rounded-full bg-aqua" style={{ width: pos(redemption.requestDate), transitionDelay: "0.55s" }} />
            <span
              className="pop absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-paper"
              style={{ left: pos(redemption.requestDate) }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      <ol className="mt-6 flex flex-col divide-y divide-steel border-t border-steel">
        {payrolls.map((p) => {
          const viaVault = fundedByRedemption.has(p.id);
          return (
            <li key={p.id} className="grid grid-cols-[56px_1fr] items-baseline gap-x-3 gap-y-1 py-3 sm:flex sm:items-center sm:justify-between sm:gap-2">
              <span className="num text-[12px] text-slate sm:w-[64px]">{short(p.date)}</span>
              <span className="flex-1 text-[14px] text-ink">
                {p.label} {formatUsdc(p.amount)}
              </span>
              <span className="col-start-2 text-[12px] text-charcoal">
                {viaVault ? `Withdraw ${day(redemption.requestDate)}` : "From ready cash"}{" "}
                <span className="text-ink">✓</span>
              </span>
            </li>
          );
        })}
      </ol>
    </CardFrame>
  );
}

export function FleetCard() {
  const { i, payouts, occurrences, plan, check } = load();
  const fleet = payouts.find((p) => p.repeat === "daily")!;
  const days = occurrences.filter((o) => o.payoutId === fleet.id).length;
  const buffer = fleet.amount * i.limits.minLiquidDays;
  const funded = plan.liquidFunds.includes(`${fleet.id}@*`);
  const parkedTotal = plan.parked.reduce((s, p) => s + p.amount, 0);
  const readyPct = Math.round((plan.liquid / i.balance) * 100);

  return (
    <CardFrame title="Agent fleet" footer={`${check.passed.length} of 8 checks passed · same plan as above`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[16px] text-ink">{fleet.label}</p>
        <Pill tone={funded ? "ready" : "due"}>{funded ? "FUNDED ✓" : "NOT FUNDED"}</Pill>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-y border-steel py-4">
        <div>
          <dt className="text-[12px] text-slate">Per day</dt>
          <dd className="num mt-1 text-[18px] text-ink">{formatUsdc(fleet.amount)}</dd>
        </div>
        <div>
          <dt className="text-[12px] text-slate">Next {days} days</dt>
          <dd className="num mt-1 text-[18px] text-ink">{formatUsdc(fleet.amount * days)}</dd>
        </div>
        <div>
          <dt className="text-[12px] text-slate">{i.limits.minLiquidDays}-day buffer</dt>
          <dd className="num mt-1 text-[18px] text-ink">{formatUsdc(buffer)}</dd>
        </div>
      </dl>

      <div className="mt-5">
        <div className="flex h-3 overflow-hidden rounded-full" role="img" aria-label={`${readyPct}% ready, ${100 - readyPct}% parked`}>
          <div className="bg-ink" style={{ width: `${readyPct}%` }} />
          <div className="bg-aqua" style={{ width: `${100 - readyPct}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[12px]">
          <span className="text-ink">
            Ready <span className="num">{formatUsdc(plan.liquid)}</span>
          </span>
          <span className="text-ink">
            Parked <span className="num">{formatUsdc(parkedTotal)}</span>
          </span>
        </div>
      </div>
    </CardFrame>
  );
}
