import { OG_SIZE, renderCard } from "@/lib/og";

export const alt = "Ebbryn setup: your balance, payouts and cash rules.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderCard({ label: "STEP 1 OF 3", lines: ["Tell Ebbryn what’s", "coming up."], tagline: "PAYOUTS. CASH RULES. HARD LIMITS." });
}
