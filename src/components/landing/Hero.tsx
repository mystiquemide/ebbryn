import Link from "next/link";
import { Suspense } from "react";
import { HeroVaults, HeroVaultsLoading } from "../HeroVaults";
import { Arrow } from "../SiteNav";

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
          <p className="max-w-[500px] text-[18px] leading-[27px] text-slate">
            Keep enough USDC ready for payroll and agent spend. Ebbryn parks the rest in <span className="text-ink">IXS vaults</span>, then schedules it
            back before each payout. <span className="text-ink">You sign every move, including the withdrawal.</span>
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link href="/setup" className="btn btn-primary">
              Plan my cash
              <Arrow />
            </Link>
            <Link href="/#caught" className="btn btn-soft rounded-[16px] px-[22px] py-[14px]">
              See a real plan
            </Link>
          </div>
          <p className="num text-[12px] uppercase tracking-[0.24px] text-slate">SERV plans. Code checks. IXS builds. You sign.</p>
          <p className="text-[13px] text-slate">Testnet. IXS vaults need verification on mainnet.</p>
        </div>

        <Suspense fallback={<HeroVaultsLoading />}>
          <HeroVaults />
        </Suspense>
      </div>
    </section>
  );
}
