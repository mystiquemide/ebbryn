import { SiteFooter } from "@/components/SiteChrome";
import { SiteNav } from "@/components/SiteNav";
import { Hero } from "@/components/landing/Hero";
import { IdleCash } from "@/components/landing/IdleCash";
import { CaughtMistake } from "@/components/landing/CaughtMistake";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { BuiltOn } from "@/components/landing/BuiltOn";
import { WhoItsFor } from "@/components/landing/WhoItsFor";
import { Vaults } from "@/components/landing/Vaults";
import { FinalCta } from "@/components/landing/FinalCta";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <IdleCash />
        <WhoItsFor />
        <CaughtMistake />
        <HowItWorks />
        <BuiltOn />
        <Vaults />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
