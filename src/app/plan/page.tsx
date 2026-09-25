import type { Metadata } from "next";
import { pageMeta } from "@/lib/og";
import Link from "next/link";
import { Suspense } from "react";
import { PlanScreen } from "@/components/plan/PlanScreen";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = pageMeta({ title: "Plan", description: "SERV Reasoning proposes what stays ready and what is parked, with withdrawal dates. Eight code checks gate every plan.", path: "/plan" });

export default function PlanPage() {
  return (
    <>
      <SiteNav step={2} />
      <main className="flex-1">
        <div className="container-page flex flex-col gap-6 py-12 md:py-16">
          <Link href="/setup" className="btn btn-soft self-start">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M13 8H4M7.5 4.5 4 8l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to setup
          </Link>
          <Suspense fallback={<div className="min-h-[50vh]" aria-busy="true" />}>
            <PlanScreen />
          </Suspense>
        </div>
      </main>
    </>
  );
}
