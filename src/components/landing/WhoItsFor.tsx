/* eslint-disable @next/next/no-img-element -- plain img with a hand-written srcSet for two static photos. */

// Photos from Unsplash (Unsplash License), downloaded into public/photos:
// payroll: https://unsplash.com/photos/man-operating-laptop-on-top-of-table-C3V88BOoRoM by Bench Accounting
// agents:  https://unsplash.com/photos/a-group-of-people-working-on-computers-in-a-room-3yb7ZsaY0LY by Anastassia Anufrieva
type Photo = { name: string; alt: string };

const PAYROLL: Photo = { name: "payroll", alt: "A man working on a laptop at a wooden table by a window" };
const AGENTS: Photo = { name: "agents", alt: "A small team working at computer monitors in an office" };

function PhotoFigure({ p }: { p: Photo }) {
  return (
    <img
      src={`/photos/${p.name}-1200.webp`}
      srcSet={`/photos/${p.name}-600.webp 600w, /photos/${p.name}-1200.webp 1200w`}
      sizes="(min-width: 1024px) 560px, 100vw"
      alt={p.alt}
      width={1200}
      height={900}
      loading="lazy"
      className="aspect-[4/3] w-full rounded-[16px] bg-cloud object-cover"
      style={{ boxShadow: "var(--shadow-cloud)" }}
    />
  );
}

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
      <div className="container-page flex flex-col gap-20 py-20 md:gap-28 md:py-28">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <PhotoFigure p={PAYROLL} />
          <div>
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
          <div className="order-2 lg:order-1">
            <p className="label">Agent operators</p>
            <h2 className="feature-heading mt-5 max-w-[520px] text-ink">Keep every agent funded, and the rest earning.</h2>
            <p className="mt-5 max-w-[520px] text-[16px] leading-[24px] text-charcoal">
              Agents that pay for APIs need topped-up wallets every day. Ebbryn plans the fleet&apos;s daily spend as one schedule, so the
              buffer is sized in days instead of guesses.
            </p>
            <Checks items={["Daily top-ups covered", "Buffer in days, not guesses", "One plan for the whole fleet"]} />
          </div>
          <div className="order-1 lg:order-2">
            <PhotoFigure p={AGENTS} />
          </div>
        </div>
      </div>
    </section>
  );
}
