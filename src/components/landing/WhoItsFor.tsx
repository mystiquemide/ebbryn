import { FleetCard, PayrollRunway } from "./PlanCards";

function Checks({ items }: { items: string[] }) {
  return (
    <ul className="mt-8 flex flex-col gap-3">
      {items.map((i) => (
        <li key={i} className="flex items-center gap-3 text-[16px] text-ink">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[6px] bg-aqua" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 16 16">
              <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="#18181b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {i}
        </li>
      ))}
    </ul>
  );
}

export function WhoItsFor() {
  return (
    <section className="border-t border-steel" aria-label="Who Ebbryn is for">
      <div className="container-page flex flex-col gap-16 py-16 md:gap-24 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <PayrollRunway />
          <div data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
            <p className="label">Payroll teams</p>
            <h2 className="feature-heading mt-5 max-w-[520px] text-ink">Pay contractors in USDC? Your float can work until payday.</h2>
            <p className="mt-5 max-w-[520px] text-[16px] leading-[24px] text-charcoal">
              You fund payroll days or weeks before it goes out. Ebbryn keeps each pay run covered and parks only the cash you won&apos;t
              need before then.
            </p>
            <Checks items={["Covers every payroll date", "Keeps the buffer you choose", "Parks only what you won't need"]} />
          </div>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div data-reveal className="order-2 lg:order-1">
            <p className="label">Agent operators</p>
            <h2 className="feature-heading mt-5 max-w-[520px] text-ink">Keep every agent funded. Put the rest to work.</h2>
            <p className="mt-5 max-w-[520px] text-[16px] leading-[24px] text-charcoal">
              Agents that pay for APIs need topped-up wallets every day. Ebbryn plans the fleet&apos;s daily spend as one schedule, so the
              buffer is sized in days instead of guesses.
            </p>
            <Checks items={["Daily top-ups covered", "Buffer in days, not guesses", "One plan for the whole fleet"]} />
          </div>
          <div className="order-1 lg:order-2">
            <FleetCard />
          </div>
        </div>
      </div>
    </section>
  );
}
