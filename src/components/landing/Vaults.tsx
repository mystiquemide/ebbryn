import { Suspense } from "react";
import { listVaults } from "@/lib/ixs";
import type { VaultInfo } from "@/lib/plan";
import { heroVaults, networkCopy, withdrawalCopy } from "@/lib/vaultCopy";

const HEADERS = ["Vault", "Network", "Withdrawals", "Deposits"];

function Deposits({ v }: { v: VaultInfo }) {
  return (
    <span className="inline-flex items-center gap-2" style={{ color: v.acceptsDeposits ? "#18181b" : "#71717a" }}>
      <span className="h-[6px] w-4 rounded-full" style={{ background: v.acceptsDeposits ? "#94faf0" : "#d4d4d8" }} aria-hidden="true" />
      {v.acceptsDeposits ? "Open" : "Paused"}
    </span>
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

function Message({ text }: { text: string }) {
  return <p className="px-6 py-8 text-[16px] text-charcoal">{text}</p>;
}

async function VaultList() {
  const vaults = await listVaults()
    .then((list) => heroVaults(list, 50))
    .catch(() => null);

  if (vaults === null) {
    return (
      <Panel note="These are IXS testnet vaults. Mainnet access requires IXS verification.">
        <Message text="IXS is not answering right now, so the vault list can't be shown. Try again in a minute." />
      </Panel>
    );
  }
  if (vaults.length === 0) {
    return (
      <Panel note="These are IXS testnet vaults. Mainnet access requires IXS verification.">
        <Message text="IXS lists no testnet vaults right now." />
      </Panel>
    );
  }

  return (
    <Panel note="These are IXS testnet vaults. Mainnet access requires IXS verification.">
      <table className="hidden w-full text-left text-[14px] sm:table">
        <thead>
          <tr className="border-b border-steel">
            {HEADERS.map((h) => (
              <th key={h} scope="col" className="num px-6 py-4 text-[12px] font-normal uppercase tracking-[0.24px] text-slate">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vaults.map((v) => (
            <tr key={v.id} className="border-b border-steel last:border-b-0">
              <td className="px-6 py-4 text-[16px] text-ink">{v.name}</td>
              <td className="px-6 py-4 text-charcoal">{networkCopy(v.network)}</td>
              <td className="px-6 py-4 text-charcoal">{withdrawalCopy(v)}</td>
              <td className="px-6 py-4">
                <Deposits v={v} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="sm:hidden">
        {vaults.map((v) => (
          <li key={v.id} className="border-b border-steel px-6 py-5 last:border-b-0">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[16px] text-ink">{v.name}</p>
              <Deposits v={v} />
            </div>
            <p className="mt-1 text-[14px] text-charcoal">
              {networkCopy(v.network)} · {withdrawalCopy(v)}
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function Vaults() {
  return (
    <section id="vaults" className="scroll-mt-8 border-t border-steel" aria-labelledby="vaults-heading">
      <div className="container-page py-20 md:py-28">
        <p className="label">Where the money goes</p>
        <h2 id="vaults-heading" className="display-section mt-5 max-w-[980px] text-ink">
          Licensed RWA vaults from IXS.
        </h2>
        <p className="mt-5 max-w-[600px] text-[18px] leading-[27px] text-slate">
          Read live from IXS. Ebbryn only parks money in a vault that is open for deposits right now.
        </p>
        <Suspense
          fallback={
            <Panel note="These are IXS testnet vaults. Mainnet access requires IXS verification.">
              <Message text="Reading IXS vaults." />
            </Panel>
          }
        >
          <VaultList />
        </Suspense>
      </div>
    </section>
  );
}
