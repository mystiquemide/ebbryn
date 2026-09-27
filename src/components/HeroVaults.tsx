import { listVaultsForDisplay } from "@/lib/ixs";
import { IXS_LABEL } from "@/lib/network";
import { asOfCopy } from "@/lib/vaultCopy";
import type { VaultInfo } from "@/lib/plan";
import { heroVaults, networkCopy, withdrawalCopy } from "@/lib/vaultCopy";
import { TideMark } from "./TideMark";

type Sheet = { name: string; network: string; withdraw: string; deposit: string; open: boolean };

function SheetCard({ s, className }: { s: Sheet; className: string }) {
  return (
    <div
      className={`relative w-full rounded-[16px] border border-steel bg-paper p-5 lg:absolute lg:w-[64%] ${className}`}
      style={{ boxShadow: "var(--shadow-cloud)" }}
    >
      <p className="num text-[12px] uppercase tracking-[0.24px] text-slate">{s.network}</p>
      <p className="font-display mt-2 text-[26px] leading-[28px] tracking-[-0.8px] text-ink">{s.name}</p>
      <div className="mt-4 flex flex-col gap-2 border-t border-steel pt-4">
        <p className="flex justify-between gap-3 text-[14px]">
          <span className="text-slate">Withdrawals</span>
          <span className="text-right text-ink">{s.withdraw}</span>
        </p>
        <p className="flex justify-between gap-3 text-[14px]">
          <span className="text-slate">Deposits</span>
          <span className="flex items-center gap-2 text-right" style={{ color: s.open ? "#18181b" : "#71717a" }}>
            <span className="h-[6px] w-4 shrink-0 rounded-full" style={{ background: s.open ? "#94faf0" : "#d4d4d8" }} />
            {s.deposit}
          </span>
        </p>
      </div>
    </div>
  );
}

function EmptyCard({ className }: { className: string }) {
  return <div className={`relative h-[150px] w-full rounded-[16px] border border-dashed border-steel bg-paper/60 lg:absolute lg:h-[46%] lg:w-[64%] ${className}`} />;
}

// Two layered sheets carrying live IXS vault facts, joined to the Ebbryn tile by the sweep line.
function Stack({ sheets, status }: { sheets: Sheet[]; status: string }) {
  const [front, back] = sheets;
  return (
    <figure className="relative w-full">
      <div
        className="tilt-loop relative mx-auto flex w-full max-w-[560px] flex-col gap-4 overflow-hidden rounded-[16px] bg-cloud p-4 lg:block lg:aspect-[1/0.92] lg:p-0"
        style={{
          boxShadow: "var(--shadow-cloud)",
          backgroundImage: "radial-gradient(#d4d4d8 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        <svg className="absolute inset-0 hidden h-full w-full lg:block" viewBox="0 0 100 92" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="sweep" x1="0" x2="1">
              <stop offset="0.52" stopColor="#07cddf" />
              <stop offset="1" stopColor="#9eed15" />
            </linearGradient>
          </defs>
          <path d="M20 22 C 20 50, 52 42, 52 66" fill="none" stroke="url(#sweep)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 2 }} />
          {/* Money on the move: a short dark segment runs the sweep from Ebbryn to the vault. The box keeps the
              viewBox aspect, so plain SVG units scale evenly and the dash math stays exact. */}
          <path className="flow-packet" d="M20 22 C 20 50, 52 42, 52 66" fill="none" stroke="#18181b" strokeLinecap="round" strokeWidth={0.6} />
        </svg>

        <div
          className="grid h-[64px] w-[64px] place-items-center rounded-[16px] bg-graphite lg:absolute lg:left-[8%] lg:top-[8%] lg:h-[88px] lg:w-[88px] lg:rounded-[20px]"
          style={{ boxShadow: "var(--shadow-graphite), var(--ring-dark)" }}
        >
          <TideMark size={44} />
        </div>

        {front ? <SheetCard s={front} className="fade-up order-2 [--d:650ms] lg:bottom-[8%] lg:left-[18%] lg:z-10" /> : <EmptyCard className="order-2 lg:bottom-[8%] lg:left-[18%]" />}
        {back ? <SheetCard s={back} className="fade-up order-3 [--d:500ms] lg:right-[6%] lg:top-[10%]" /> : <EmptyCard className="order-3 lg:right-[6%] lg:top-[10%]" />}
      </div>
      <figcaption className="num mt-3 text-center text-[12px] uppercase tracking-[0.24px] text-slate">{status}</figcaption>
    </figure>
  );
}

function toSheets(vaults: VaultInfo[]): Sheet[] {
  return heroVaults(vaults, 2).map((v) => ({
    name: v.name,
    network: networkCopy(v.network),
    withdraw: withdrawalCopy(v),
    deposit: v.acceptsDeposits ? "Open" : "Paused",
    open: v.acceptsDeposits,
  }));
}

export async function HeroVaults() {
  const { vaults, asOf, live } = await listVaultsForDisplay();
  return <Stack sheets={toSheets(vaults)} status={live ? `Live from ${IXS_LABEL}` : asOfCopy(asOf)} />;
}

export function HeroVaultsLoading() {
  return <Stack sheets={[]} status="Reading IXS vaults" />;
}

