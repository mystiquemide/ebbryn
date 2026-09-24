/* eslint-disable @next/next/no-img-element -- plain img with a hand-written srcSet for one static photo. */
import Link from "next/link";
import { REPO_URL } from "@/lib/site";
import { Arrow } from "../SiteNav";

// Photo: https://unsplash.com/photos/waves-in-the-ocean-cFALQAMJJEY by Zac Gudakov (Unsplash License), self-hosted.
export function FinalCta() {
  return (
    <section className="container-page pb-20 md:pb-28" aria-labelledby="cta-heading">
      <div data-reveal className="relative isolate overflow-hidden rounded-[16px] bg-graphite" style={{ boxShadow: "var(--shadow-graphite)" }}>
        <img
          src="/photos/tide-2000.webp"
          srcSet="/photos/tide-1000.webp 1000w, /photos/tide-2000.webp 2000w"
          sizes="(min-width: 1248px) 1200px, 100vw"
          alt=""
          width={2000}
          height={1125}
          loading="lazy"
          className="push-in absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10" style={{ background: "rgba(24,24,27,0.62)" }} aria-hidden="true" />
        <div className="flex flex-col gap-8 px-6 py-16 md:px-14 md:py-24">
          <h2 id="cta-heading" className="display-hero max-w-[760px] text-paper">
            Plan your next payday in a minute.
          </h2>
          <p className="max-w-[520px] text-[18px] leading-[27px] text-white/80">
            Add your payouts, write your rules, and see exactly what stays ready and what goes to work before anything moves.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/setup" className="btn btn-primary">
              Plan my cash
              <Arrow />
            </Link>
            {REPO_URL && (
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="btn btn-translucent rounded-[16px] px-[22px] py-[14px]">
                Read the code
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
