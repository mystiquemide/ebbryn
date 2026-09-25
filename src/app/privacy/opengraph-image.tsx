import { OG_SIZE, renderCard } from "@/lib/og";

export const alt = "Ebbryn privacy policy.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderCard({ label: "PRIVACY", lines: ["Privacy policy"], tagline: "NO ACCOUNTS. NO ANALYTICS." });
}
