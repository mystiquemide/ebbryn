import { OG_SIZE, renderCard } from "@/lib/og";

export const alt = "Ebbryn: cash that comes back on time. SERV plans. Code checks. IXS builds. You sign.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderCard({ label: "USDC CASH OFFICER", lines: ["Cash that comes back", "on time."], tagline: "SERV PLANS. CODE CHECKS. IXS BUILDS. YOU SIGN." });
}
