import { Suspense } from "react";
import { listVaultsForDisplay } from "@/lib/ixs";
import type { VaultInfo } from "@/lib/plan";
import { asOfCopy, networkCopy, withdrawalCopy } from "@/lib/vaultCopy";

function Deposits({ v }: { v: VaultInfo }) {
  return (
    <span className="inline-flex items-center gap-2" style={{ color: v.acceptsDeposits ? "#18181b" : "#71717a" }}>
      <span className="h-[6px] w-4 rounded-full" style={{ background: v.acceptsDeposits ? "#94faf0" : "#d4d4d8" }} aria-hidden="true" />
      {v.acceptsDeposits ? "Open" : "Paused"}
    </span>
  );
}

function Row({ v }: { v: VaultInfo }) {
  return (
    <li className="grid gap-1 border-b border-steel px-6 py-5 last:border-b-0 sm:grid-cols-[1.4fr_1fr_1.2fr_auto] sm:items-center sm:gap-6">
      <p className="text-[16px] text-ink">{v.name}</p>
      <p className="text-[14px] text-charcoal">{networkCopy(v.network)}</p>
      <p className="text-[14px] text-charcoal">{withdrawalCopy(v)}</p>
      <Deposits v={v} />
    </li>
  );
}

function Panel({ children, note }: { children: React.ReactNode; note: string }) {
  return (
    <div className="mt-10 overflow-hidden rounded-[16px] bg-cloud" style={{ boxShadow: "var(--shadow-cloud)" }}>
      {children}
      <p className="border-t border-steel px-6 py-4 text-[13px] text-slate">{note}</p>
    </div>
  );
}

async function VaultList() {
  const { vaults, asOf, live } = await listVaultsForDisplay();
  const open = vaults.filter((v) => v.acceptsDeposits);
  const paused = vaults.filter((v) => !v.acceptsDeposits);
  const note = `${live ? "Live from IXS testnet" : asOfCopy(asOf)}. Mainnet access requires IXS verification.`;

  return (
    <Panel note={note}>
      <p className="num px-6 pt-5 text-[12px] uppercase tracking-[0.24px] text-slate">
        Open for deposits ({open.length})
      </p>
      {open.length > 0 ? (
        <ul className="mt-2">
          {open.map((v) => (
            <Row key={v.id} v={v} />
          ))}
        </ul>
      ) : (
        <p className="px-6 py-5 text-[16px] text-charcoal">No IXS vault is taking deposits right now, so Ebbryn keeps everything ready.</p>
      )}
      {paused.length > 0 && (
        <details className="group border-t border-steel">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between px-6 py-4 text-[14px] text-charcoal hover:text-ink">
            <span>Other IXS vaults, paused right now ({paused.length})</span>
            <svg width="16" height="16" viewBox="0 0 16 16" className="transition-transform group-open:rotate-180" aria-hidden="true">
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <ul className="border-t border-steel">
            {paused.map((v) => (
              <Row key={v.id} v={v} />
            ))}
          </ul>
        </details>
      )}
    </Panel>
  );
}

export function Vaults() {
  return (
    <section id="vaults" className="scroll-mt-8 border-t border-steel" aria-labelledby="vaults-heading">
      <div className="container-page py-20 md:py-28">
        <p className="label">Where the money goes</p>
        <h2 id="vaults-heading" className="display-section mt-5 max-w-[980px] text-ink">
          RWA vaults from IXS.
        </h2>
        <p className="mt-5 max-w-[600px] text-[18px] leading-[27px] text-slate">
          Read from IXS. Ebbryn only parks money in a vault that is open for deposits right now.
        </p>
        <Suspense
          fallback={
            <Panel note="Mainnet access requires IXS verification.">
              <p className="px-6 py-8 text-[16px] text-charcoal">Reading IXS vaults.</p>
            </Panel>
          }
        >
          <VaultList />
        </Suspense>
      </div>
    </section>
  );
}
