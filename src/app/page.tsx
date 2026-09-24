import { SiteFooter } from "@/components/SiteChrome";
import { SiteNav } from "@/components/SiteNav";
import { Hero } from "@/components/landing/Hero";
import { IdleCash } from "@/components/landing/IdleCash";
import { CaughtMistake } from "@/components/landing/CaughtMistake";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <IdleCash />
        <CaughtMistake />
      </main>
      <SiteFooter />
    </>
  );
}
