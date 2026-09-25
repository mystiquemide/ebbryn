import { OG_SIZE, renderCard } from "@/lib/og";

export const alt = "Ebbryn terms of use.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderCard({ label: "TERMS", lines: ["Terms of use"], tagline: "NON-CUSTODIAL. TESTNET ONLY. NOT ADVICE." });
}
