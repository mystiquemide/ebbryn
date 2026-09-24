import Link from "next/link";
import { REPO_URL } from "@/lib/site";
import { Wordmark } from "./TideMark";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-steel bg-paper">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Wordmark />
          <p className="text-slate">Cash that comes back on time.</p>
        </div>
        <div className="flex flex-col gap-1 md:gap-3">
          <p className="label">Product</p>
          <Link href="/#how" className="inline-flex min-h-[44px] items-center text-charcoal hover:text-ink md:min-h-0">How it works</Link>
          <Link href="/#vaults" className="inline-flex min-h-[44px] items-center text-charcoal hover:text-ink md:min-h-0">Vaults</Link>
        </div>
        <div className="flex flex-col gap-1 md:gap-3">
          <p className="label">Resources</p>
          <Link href="/docs" className="inline-flex min-h-[44px] items-center text-charcoal hover:text-ink md:min-h-0">Docs</Link>
          <Link href="/terms" className="inline-flex min-h-[44px] items-center text-charcoal hover:text-ink md:min-h-0">Terms</Link>
          <Link href="/privacy" className="inline-flex min-h-[44px] items-center text-charcoal hover:text-ink md:min-h-0">Privacy</Link>
        </div>
        <div className="flex flex-col gap-1 md:gap-3">
          <p className="label label-dev">Built on</p>
          <a href="https://www.openserv.ai" target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center text-charcoal hover:text-ink md:min-h-0">
            SERV Reasoning by OpenServ
          </a>
          <a href="https://www.ixs.finance/vaults" target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center text-charcoal hover:text-ink md:min-h-0">
            IXS vaults
          </a>
          {REPO_URL && (
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center text-charcoal hover:text-ink md:min-h-0">
              GitHub
            </a>
          )}
        </div>
      </div>
      <div className="border-t border-steel">
        <div className="container-page flex py-6 text-[12px] text-slate md:justify-end">
        <span className="num">Testnet only. Not financial advice.</span>
        </div>
      </div>
    </footer>
  );
}
