import { OG_SIZE, renderCard } from "@/lib/og";

export const alt = "Ebbryn docs: quickstart, checks, API and troubleshooting.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderCard({ label: "DOCS", lines: ["Using Ebbryn"], tagline: "QUICKSTART. CHECKS. API. TROUBLESHOOTING." });
}
