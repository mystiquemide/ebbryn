import { SiteFooter } from "@/components/SiteChrome";
import { SiteNav } from "@/components/SiteNav";
import { Hero } from "@/components/landing/Hero";
import { IdleCash } from "@/components/landing/IdleCash";
import { CaughtMistake } from "@/components/landing/CaughtMistake";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhoItsFor } from "@/components/landing/WhoItsFor";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <IdleCash />
        <CaughtMistake />
        <HowItWorks />
        <WhoItsFor />
      </main>
      <SiteFooter />
    </>
  );
}
