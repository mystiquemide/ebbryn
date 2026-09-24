import Link from "next/link";
import { Suspense } from "react";
import { HeroVaults, HeroVaultsLoading } from "../HeroVaults";
import { Arrow } from "../SiteNav";

// Two thin tide lines drifting along the bottom of the hero. Each path holds two identical periods so the loop is seamless.
const WAVE = "M0 60 C 150 20, 450 20, 600 60 S 1050 100, 1200 60 S 1650 20, 1800 60 S 2250 100, 2400 60";

function TideLines() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[140px] overflow-hidden" aria-hidden="true">
      <svg className="drift absolute bottom-6 left-0 h-[90px] w-[200%]" style={{ "--t": "26s" } as React.CSSProperties} viewBox="0 0 2400 120" preserveAspectRatio="none">
        <path d={WAVE} fill="none" stroke="#94faf0" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <svg className="drift absolute bottom-0 left-0 h-[70px] w-[200%] opacity-70" style={{ "--t": "38s" } as React.CSSProperties} viewBox="0 0 2400 120" preserveAspectRatio="none">
        <path d={WAVE} fill="none" stroke="#bff660" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <TideLines />
      <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-28 md:py-20">
        <div className="flex flex-col gap-6">
          <p className="label fade-up">USDC cash officer</p>
          <h1 className="display-hero text-ink">
            {["Cash that", "comes back", "on time."].map((line, i) => (
              <span key={line} className="rise-line">
                <span style={{ "--d": `${120 + i * 110}ms` } as React.CSSProperties}>{line}</span>
              </span>
            ))}
          </h1>
          <p style={{ "--d": "520ms" } as React.CSSProperties} className="fade-up max-w-[500px] text-[18px] leading-[27px] text-slate">
            Keep enough USDC ready for payroll and agent spend. Ebbryn parks the rest in <span className="text-ink">IXS vaults</span>, then schedules it
            back before each payout. <span className="text-ink">You sign every move, including the withdrawal.</span>
          </p>
          <div style={{ "--d": "640ms" } as React.CSSProperties} className="fade-up flex flex-col gap-3 pt-2 sm:flex-row">
            <Link href="/setup" className="btn btn-primary">
              Plan my cash
              <Arrow />
            </Link>
            <Link href="/#caught" className="btn btn-soft rounded-[16px] px-[22px] py-[14px]">
              See a real plan
            </Link>
          </div>
          <p style={{ "--d": "760ms" } as React.CSSProperties} className="fade-up num text-[12px] uppercase tracking-[0.24px] text-slate">SERV plans. Code checks. IXS builds. You sign.</p>
          <p style={{ "--d": "820ms" } as React.CSSProperties} className="fade-up text-[13px] text-slate">Testnet. IXS vaults need verification on mainnet.</p>
        </div>

        <div style={{ "--d": "300ms" } as React.CSSProperties} className="fade-up">
          <Suspense fallback={<HeroVaultsLoading />}>
            <HeroVaults />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
