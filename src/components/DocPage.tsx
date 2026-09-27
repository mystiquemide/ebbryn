import type { ReactNode } from "react";
import { SiteFooter } from "./SiteChrome";
import { SiteNav } from "./SiteNav";

export type TocItem = { id: string; label: string };

// Shared shell for long-form pages: title block, sticky contents on desktop, readable column.
export function DocPage({ label, title, intro, updated, toc, children, footer = true }: { label: string; title: string; intro: ReactNode; updated?: string; toc: TocItem[]; children: ReactNode; footer?: boolean }) {
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <div className="container-page py-16 md:py-24">
          <p className="label">{label}</p>
          <h1 className="display-section mt-5 max-w-[860px] text-ink">{title}</h1>
          <div className="mt-5 max-w-[680px] text-[18px] leading-[27px] text-slate">{intro}</div>
          {updated && <p className="num mt-4 text-[12px] uppercase tracking-[0.24px] text-slate">Last updated {updated}</p>}

          <div className="mt-12 grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
            <nav aria-label="On this page" className="lg:sticky lg:top-8 lg:self-start">
              <p className="num text-[12px] uppercase tracking-[0.24px] text-slate">On this page</p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 lg:flex-col lg:gap-y-2">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="inline-flex min-h-[44px] items-center text-[14px] text-charcoal hover:text-ink lg:min-h-0">
                      {t.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <article className="doc max-w-[720px] [&>h2:first-child]:mt-0">{children}</article>
          </div>
        </div>
      </main>
      {footer && <SiteFooter />}
    </>
  );
}
