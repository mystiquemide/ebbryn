import type { Day } from "@/lib/timeline";
import { formatUsdc } from "@/lib/units";

const TOP = 16;
const BASE = 170;
const BOTTOM = 290;

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

type Mark = { i: number; kind: "withdraw" | "paid"; label: string; amount: number; date: string };

function Plot({ days, balance, marks, w: W, className }: { days: Day[]; balance: number; marks: Mark[]; w: number; className: string }) {
  const n = days.length;
  const x = (i: number) => (i / (n - 1)) * W;
  const up = (v: number) => BASE - (Math.max(v, 0) / balance) * (BASE - TOP);
  const down = (v: number) => BASE + (Math.max(v, 0) / balance) * (BOTTOM - BASE);
  const readyPath = days.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${up(d.ready).toFixed(1)}`).join(" ");
  const parkedArea =
    `M0 ${BASE} ` + days.map((d, i) => `L${x(i).toFixed(1)} ${down(d.parked).toFixed(1)}`).join(" ") + ` L${W} ${BASE} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${BOTTOM + 10}`} className={className} role="img" aria-label="Ready and parked cash over the next 30 days">
      <path d={parkedArea} fill="#94faf0" />
      <line x1="0" x2={W} y1={BASE} y2={BASE} stroke="#d4d4d8" strokeWidth="1" />
      <path d={readyPath} fill="none" stroke="#18181b" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {marks.map((m, k) =>
        m.kind === "withdraw" ? (
          <circle key={k} cx={x(m.i)} cy={BASE} r="8" fill="#94faf0" stroke="#18181b" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        ) : (
          <line key={k} x1={x(m.i)} x2={x(m.i)} y1={TOP} y2={BASE} stroke="#18181b" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        ),
      )}
      {days.map((d, i) => (
        <rect key={d.date} x={x(i) - W / n / 2} y="0" width={W / n} height={BOTTOM + 10} fill="transparent">
          <title>{`${dayLabel(d.date)}: ready ${formatUsdc(d.ready)}, parked ${formatUsdc(d.parked)}`}</title>
        </rect>
      ))}
    </svg>
  );
}

// Ready cash rides above the baseline, parked cash sits below it in aqua. Drawn only from the plan's own timeline.
export function TideChart({ days, balance, start }: { days: Day[]; balance: number; start: { ready: number; parked: number } }) {
  const n = days.length;
  const firstPaid = days[0].paid.reduce((t, p) => t + p.amount, 0);

  // Daily payouts would bury the chart in ticks, so only non-daily payouts and withdrawals get a marker.
  const counts = new Map<string, number>();
  for (const d of days) for (const p of d.paid) counts.set(p.payoutId, (counts.get(p.payoutId) ?? 0) + 1);
  const daily = new Set([...counts].filter(([, c]) => c > n / 2).map(([id]) => id));
  const marks: Mark[] = days.flatMap((d, i) => [
    ...(d.withdrawnRequested ? [{ i, kind: "withdraw" as const, label: "Withdraw", amount: d.withdrawnRequested, date: d.date }] : []),
    ...d.paid.filter((p) => !daily.has(p.payoutId)).map((p) => ({ i, kind: "paid" as const, label: p.label, amount: p.amount, date: d.date })),
  ]);

  return (
    <figure className="rounded-[16px] bg-cloud p-5 md:p-6" style={{ boxShadow: "var(--shadow-cloud)" }}>
      <figcaption className="flex flex-wrap items-center justify-between gap-3">
        <span className="num text-[12px] uppercase tracking-[0.24px] text-charcoal">Next {n} days</span>
        <span className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-charcoal">
          <span className="flex items-center gap-2">
            <span className="h-[2px] w-4 bg-ink" aria-hidden="true" /> Ready <span className="num text-ink">{formatUsdc(start.ready)}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-4 rounded-[3px] bg-aqua" aria-hidden="true" /> Parked <span className="num text-ink">{formatUsdc(start.parked)}</span>
          </span>
          <span className="text-slate">
            at the start of {dayLabel(days[0].date)}
            {firstPaid > 0 && <>, before that day&apos;s <span className="num">{formatUsdc(firstPaid)}</span> in payouts</>}
          </span>
        </span>
      </figcaption>

      {/* Phones get a narrower viewBox so the chart keeps real height instead of shrinking to a strip. */}
      <Plot days={days} balance={balance} marks={marks} w={420} className="mt-4 h-auto w-full md:hidden" />
      <Plot days={days} balance={balance} marks={marks} w={1000} className="mt-4 hidden h-auto w-full md:block" />

      <div className="num mt-2 flex justify-between text-[12px] text-slate">
        <span>{dayLabel(days[0].date)}</span>
        <span>{dayLabel(days[Math.floor(n / 2)].date)}</span>
        <span>{dayLabel(days[n - 1].date)}</span>
      </div>

      <div className="sr-only">
      <table>
        <caption>Ready and parked cash on days when money moves</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">What happens</th>
            <th scope="col">Ready after</th>
            <th scope="col">Parked after</th>
          </tr>
        </thead>
        <tbody>
          {[0, ...marks.map((m) => m.i)]
            .filter((v, k, a) => a.indexOf(v) === k)
            .map((i) => (
              <tr key={i}>
                <th scope="row">{dayLabel(days[i].date)}</th>
                <td>
                  {i === 0
                    ? "Start"
                    : marks
                        .filter((m) => m.i === i)
                        .map((m) => `${m.kind === "withdraw" ? "Withdraw from vault" : m.label} ${formatUsdc(m.amount)}`)
                        .join(", ")}
                </td>
                <td>{formatUsdc(days[i].ready)}</td>
                <td>{formatUsdc(days[i].parked)}</td>
              </tr>
            ))}
        </tbody>
      </table>
      </div>

      {marks.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2 border-t border-steel pt-4">
          {marks.map((m, k) => (
            <li
              key={k}
              className="num inline-flex items-center gap-2 rounded-[6px] px-2 py-1 text-[12px]"
              style={m.kind === "withdraw" ? { background: "#94faf0", color: "#18181b" } : { background: "#27272a", color: "#ffffff" }}
            >
              {dayLabel(m.date).toUpperCase()} · {m.kind === "withdraw" ? "WITHDRAW FROM VAULT" : m.label} {formatUsdc(m.amount)}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
