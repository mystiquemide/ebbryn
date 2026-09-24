const STEPS = [
  {
    n: "01",
    title: "Your payouts",
    body: "Add what's coming up: payroll dates, agent top-ups, anything with a date and an amount. Then write your cash rules in plain English.",
    icon: <path d="M3.5 4.5h9v8h-9zM3.5 7h9M6 3v3M10 3v3" fill="none" stroke="#94faf0" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />,
  },
  {
    n: "02",
    title: "SERV plans, code checks",
    body: "SERV Reasoning weighs your rules and proposes how much stays ready and how much goes to work. Eight checks run on every plan before you see it.",
    icon: <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="#94faf0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    n: "03",
    title: "You sign",
    body: "IXS builds each transaction. You see the contract and the amount, and nothing moves until you sign it in your own wallet.",
    icon: <path d="M3 12.5c2-.3 3-4.5 4.5-4.5S8.8 11 10 11s1.5-2 3-2.5" fill="none" stroke="#94faf0" strokeWidth="1.6" strokeLinecap="round" />,
  },
];

const GUARANTEES = [
  "Every payout is funded exactly once",
  "Nothing goes into a vault that isn't taking deposits",
  "Withdrawals are timed to land a day early",
  "Your hard limits beat anything written in the rules",
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-8" aria-labelledby="how-heading">
      <div className="container-page py-20 md:py-28">
        <p className="label">How it works</p>
        <h2 id="how-heading" data-reveal className="display-section mt-5 max-w-[1120px] text-ink">
          Three steps. You stay in control of every one.
        </h2>

        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              data-reveal
              className="lift flex flex-col gap-4 rounded-[16px] bg-cloud p-6 md:p-8"
              style={{ boxShadow: "var(--shadow-cloud)", "--d": `${i * 140}ms` } as React.CSSProperties}
            >
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-graphite">
                  <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
                    {s.icon}
                  </svg>
                </span>
                <span className="num text-[13px] text-slate">{s.n}</span>
              </div>
              <h3 className="feature-heading mt-4 text-ink">{s.title}</h3>
              <p className="text-[16px] leading-[24px] text-charcoal">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 grid gap-8 border-t border-steel pt-10 md:grid-cols-[1fr_2fr]">
          <p className="text-[18px] leading-[27px] text-ink">What the checks guarantee, on every plan:</p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {GUARANTEES.map((g, i) => (
              <li key={g} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className="flex items-start gap-3 text-[16px] leading-[22px] text-ink">
                <span className="mt-[1px] grid h-5 w-5 shrink-0 place-items-center rounded-[6px] bg-aqua" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 16 16">
                    <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="#18181b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
