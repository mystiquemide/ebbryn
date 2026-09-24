"use client";

import type { Plan, VaultInfo } from "@/lib/plan";
import { withdrawalIcs } from "@/lib/ics";
import { formatUsdc } from "@/lib/units";

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function download(date: string, amount: string, vaultName: string) {
  const blob = new Blob([withdrawalIcs(date, amount, vaultName, `${location.origin}/moves`)], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `ebbryn-withdrawal-${date}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Withdrawals are the step people forget, so each one gets a plain callout and a calendar file.
export function WithdrawalReminder({ plan, vaults, note }: { plan: Plan; vaults: VaultInfo[]; note?: string }) {
  if (!plan.redemptions.length) return null;
  return (
    <div className="rounded-[12px] bg-cloud p-4 text-[14px] leading-[21px] text-charcoal">
      {plan.redemptions.map((r, k) => {
        const name = vaults.find((v) => v.id === r.vaultId)?.name ?? "the vault";
        const amount = formatUsdc(r.amount);
        return (
          <div key={k} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between [&+&]:mt-3">
            <p>
              On <span className="num text-ink">{dayLabel(r.requestDate)}</span> you&apos;ll need to come back and sign the{" "}
              <span className="num text-ink">{amount}</span> withdrawal. Nothing happens automatically.
            </p>
            <button type="button" className="btn btn-soft shrink-0 self-start sm:self-auto" onClick={() => download(r.requestDate, amount, name)}>
              Add to calendar
            </button>
          </div>
        );
      })}
      {note && <p className="mt-3 text-[13px] text-slate">{note}</p>}
    </div>
  );
}
