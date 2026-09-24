import type { Metadata } from "next";
import { SetupForm } from "@/components/setup/SetupForm";
import { SiteFooter } from "@/components/SiteChrome";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = { title: "Setup · Ebbryn" };

export default function SetupPage() {
  return (
    <>
      <SiteNav step={1} />
      <main className="flex-1">
        <SetupForm />
      </main>
      <SiteFooter />
    </>
  );
}
