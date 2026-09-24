import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav, Arrow } from "@/components/SiteNav";

export const metadata: Metadata = { title: "Page not found · Ebbryn" };

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="flex flex-1 items-center">
        <div className="container-page flex flex-col gap-6 py-24">
          <p className="label">404</p>
          <h1 className="display-hero max-w-[760px] leading-[1.02] text-ink">This page drifted out with the tide.</h1>
          <p className="max-w-[520px] text-[18px] leading-[27px] text-slate">
            The link may be old or mistyped. Your plan and payouts are still saved in this browser.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/setup" className="btn btn-primary">
              Plan my cash
              <Arrow />
            </Link>
            <Link href="/" className="btn btn-soft rounded-[16px] px-[22px] py-[14px]">
              Back home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
