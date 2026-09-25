import { OG_SIZE, renderCard } from "@/lib/og";

export const alt = "Ebbryn moves: the exact IXS vault transactions you sign.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderCard({ label: "STEP 3 OF 3", lines: ["You sign", "every move."], tagline: "IXS BUILDS THE TRANSACTIONS. YOU SIGN THEM." });
}
