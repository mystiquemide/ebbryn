import { OG_SIZE, renderCard } from "@/lib/og";

export const alt = "An Ebbryn plan: what stays ready, what’s parked, and 8 code checks.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderCard({ label: "STEP 2 OF 3", lines: ["SERV plans.", "Code checks."], tagline: "8 CHECKS GATE EVERY PLAN." });
}
