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
          <p className="max-w-[480px] text-[18px] leading-[27px] text-slate">
            Tell Ebbryn your payouts and your rules. It keeps enough ready for payday and puts the rest to work in{" "}
            <span className="text-ink">IXS vaults</span>. <span className="text-ink">You sign every move.</span>
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
        </div>

        <Suspense fallback={<HeroVaultsLoading />}>
          <HeroVaults />
        </Suspense>
      </div>
    </section>
  );
}
