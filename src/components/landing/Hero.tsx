import Link from "next/link";
import { Suspense } from "react";
import { HeroVaults, HeroVaultsLoading } from "../HeroVaults";
import { Arrow } from "../SiteNav";

const CAPABILITIES = [
  {
    label: "Never short on payday",
    icon: <path d="M3 9.5 6.5 13 13 4.5" fill="none" stroke="#94faf0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    label: "Rules in plain English",
    icon: <path d="M3.5 5h9M3.5 8h9M3.5 11h5.5" fill="none" stroke="#94faf0" strokeWidth="1.6" strokeLinecap="round" />,
  },
  {
    label: "You sign every move",
    icon: <path d="M3 12.5c2-.3 3-4.5 4.5-4.5S8.8 11 10 11s1.5-2 3-2.5" fill="none" stroke="#94faf0" strokeWidth="1.6" strokeLinecap="round" />,
  },
];

export function Hero() {
  return (
    <section className="overflow-hidden">
      <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-28 md:py-20">
        <div className="flex flex-col gap-6">
          <p className="label">USDC cash officer</p>
          <h1 className="display-hero text-ink">
            Cash that
            <br />
            comes back
            <br />
            on time.
          </h1>
          <p className="max-w-[480px] text-[18px] leading-[27px] text-slate">
            Tell Ebbryn your payouts and your rules. It keeps enough ready for payday and puts the rest to work in{" "}
            <span className="text-ink">IXS vaults</span>. <span className="text-ink">You sign every move.</span>
          </p>
          <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-0">
            {CAPABILITIES.map((c, i) => (
              <li
                key={c.label}
                className={`flex items-center gap-2 text-ink ${i > 0 ? "sm:border-l sm:border-steel sm:pl-4" : ""} ${i < CAPABILITIES.length - 1 ? "sm:pr-4" : ""}`}
              >
                <span className="grid h-5 w-5 place-items-center rounded-[6px] bg-graphite">
                  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                    {c.icon}
                  </svg>
                </span>
                {c.label}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link href="/setup" className="btn btn-primary">
              Plan my cash
              <Arrow />
            </Link>
            <Link href="/#caught" className="btn btn-soft rounded-[16px] px-[22px] py-[14px]">
              See a real plan
            </Link>
          </div>
        </div>

        <Suspense fallback={<HeroVaultsLoading />}>
          <HeroVaults />
        </Suspense>
      </div>
    </section>
  );
}
