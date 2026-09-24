import Link from "next/link";
import { REPO_URL } from "@/lib/site";
import { Wordmark } from "./TideMark";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-steel bg-paper">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Wordmark />
          <p className="text-slate">Cash that comes back on time.</p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="label">Product</p>
          <Link href="/#how" className="text-charcoal hover:text-ink">How it works</Link>
          <Link href="/#vaults" className="text-charcoal hover:text-ink">Vaults</Link>
          <Link href="/#pricing" className="text-charcoal hover:text-ink">Pricing</Link>
        </div>
        <div className="flex flex-col gap-3">
          <p className="label label-dev">Built on</p>
          <a href="https://www.openserv.ai" target="_blank" rel="noreferrer" className="text-charcoal hover:text-ink">
            SERV Reasoning by OpenServ
          </a>
          <a href="https://www.ixs.finance/vaults" target="_blank" rel="noreferrer" className="text-charcoal hover:text-ink">
            IXS vaults
          </a>
          {REPO_URL && (
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-charcoal hover:text-ink">
              GitHub
            </a>
          )}
        </div>
      </div>
      <div className="border-t border-steel">
        <div className="container-page flex flex-col gap-2 py-6 text-[12px] text-slate md:flex-row md:justify-between">
        <span>Built for the SERV Hackathon, RWA Vaults track.</span>
        <span className="num">Testnet only. Not financial advice.</span>
        </div>
      </div>
    </footer>
  );
}
