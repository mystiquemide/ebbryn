// A single all-day calendar event, so the user remembers to come back and sign a withdrawal.
const esc = (t: string) => t.replace(/[\\;,]/g, (c) => `\\${c}`);

export function withdrawalIcs(date: string, amount: string, vaultName: string, url: string): string {
  const d = date.replaceAll("-", "");
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const end = next.toISOString().slice(0, 10).replaceAll("-", "");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ebbryn//Withdrawal reminder//EN",
    "BEGIN:VEVENT",
    `UID:ebbryn-${d}-${amount.replace(/\D/g, "")}@ebbryn`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${d}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${esc(`Sign ${amount} USDC withdrawal in Ebbryn`)}`,
    `DESCRIPTION:${esc(`Withdraw ${amount} USDC from ${vaultName} so it's back before the payout it funds. Nothing happens automatically. ${url}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
