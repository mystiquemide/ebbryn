import { AnnouncementStrip, SiteFooter } from "@/components/SiteChrome";
import { SiteNav } from "@/components/SiteNav";
import { Hero } from "@/components/landing/Hero";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <AnnouncementStrip />
      <SiteNav />
      <main className="flex-1">
        <Hero />
      </main>
      <SiteFooter />
    </>
  );
}
