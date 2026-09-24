import type { Metadata } from "next";
import Link from "next/link";
import { MovesScreen } from "@/components/moves/MovesScreen";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = { title: "Moves · Ebbryn" };

export default function MovesPage() {
  return (
    <>
      <SiteNav step={3} />
      <main className="flex-1">
        <div className="container-page flex flex-col gap-6 py-12 md:py-16">
          <Link href="/plan" className="btn btn-soft self-start">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M13 8H4M7.5 4.5 4 8l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to plan
          </Link>
          <MovesScreen />
        </div>
      </main>
    </>
  );
}
