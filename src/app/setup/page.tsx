import type { Metadata } from "next";
import { pageMeta } from "@/lib/og";
import { SetupForm } from "@/components/setup/SetupForm";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = pageMeta({ title: "Setup", description: "Enter your USDC balance, upcoming payouts and cash rules. Ebbryn plans what stays ready and what gets parked in IXS vaults.", path: "/setup" });

export default function SetupPage() {
  return (
    <>
      <SiteNav step={1} />
      <main className="flex-1">
        <SetupForm />
      </main>
    </>
  );
}
