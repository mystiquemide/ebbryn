/* eslint-disable @next/next/no-img-element -- Unsplash asks for hotlinked images from its own CDN, so no next/image proxy. */

type Photo = { src: string; alt: string; author: string; authorUrl: string; photoUrl: string };

const UTM = "utm_source=ebbryn&utm_medium=referral";

const PAYROLL: Photo = {
  src: "https://images.unsplash.com/photo-1664575600796-ffa828c5cb6e",
  alt: "A man working at a laptop at a wooden desk by a bright window",
  author: "Microsoft 365",
  authorUrl: "https://unsplash.com/@microsoft365",
  photoUrl: "https://unsplash.com/photos/a-man-sitting-at-a-table-in-front-of-a-laptop-TLiWhlDEJwA",
};

const AGENTS: Photo = {
  src: "https://images.unsplash.com/photo-1723987251277-18fc0a1effd0",
  alt: "A small team working at computer monitors in an office",
  author: "Anastassia Anufrieva",
  authorUrl: "https://unsplash.com/@antoie",
  photoUrl: "https://unsplash.com/photos/a-group-of-people-working-on-computers-in-a-room-3yb7ZsaY0LY",
};

function PhotoFigure({ p }: { p: Photo }) {
  const base = `${p.src}?fit=crop&crop=entropy&q=80&fm=webp`;
  return (
    <figure>
      <img
        src={`${base}&w=1200&h=900`}
        srcSet={`${base}&w=600&h=450 600w, ${base}&w=900&h=675 900w, ${base}&w=1200&h=900 1200w`}
        sizes="(min-width: 1024px) 560px, 100vw"
        alt={p.alt}
        width={1200}
        height={900}
        loading="lazy"
        className="aspect-[4/3] w-full rounded-[16px] bg-cloud object-cover"
        style={{ boxShadow: "var(--shadow-cloud)" }}
      />
      <figcaption className="mt-3 text-[12px] text-slate">
        Photo by{" "}
        <a href={`${p.authorUrl}?${UTM}`} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-ink hover:underline">
          {p.author}
        </a>{" "}
        on{" "}
        <a href={`https://unsplash.com/?${UTM}`} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-ink hover:underline">
          Unsplash
        </a>
      </figcaption>
    </figure>
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
