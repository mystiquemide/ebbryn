import { AnnouncementStrip, SiteFooter } from "@/components/SiteChrome";
import { SiteNav } from "@/components/SiteNav";

export default function Home() {
  return (
    <>
      <AnnouncementStrip />
      <SiteNav />
      <main className="flex-1" />
      <SiteFooter />
    </>
  );
}
