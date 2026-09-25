import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The card people see when an Ebbryn link is shared on X, Telegram or Slack.
export const alt = "Ebbryn: cash that comes back on time. SERV plans. Code checks. IXS builds. You sign.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// One period of the tide line, repeated across the card.
const WAVE = "M0 60 C 150 20, 450 20, 600 60 S 1050 100, 1200 60";

export default async function Image() {
  const [display, mono] = await Promise.all([
    readFile(join(process.cwd(), "assets/InterTight-500.ttf")),
    readFile(join(process.cwd(), "assets/ChivoMono-400.ttf")),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#ffffff", padding: "64px 72px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="56" height="56" viewBox="0 0 28 28">
            <rect width="28" height="28" rx="6" fill="#27272a" />
            <path d="M5 11h4.5c1.5 0 2 1 2.6 3.2.7 2.7 1.3 3.8 2.4 3.8s1.7-1.1 2.4-3.8C17.5 12 18 11 19.5 11H23" fill="none" stroke="#94faf0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: "Inter Tight", fontSize: 44, letterSpacing: -1.6, color: "#18181b" }}>ebbryn</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 56 }}>
          <div style={{ width: 28, height: 10, borderRadius: 10, background: "#94faf0" }} />
          <span style={{ fontFamily: "Chivo Mono", fontSize: 22, letterSpacing: 0.5, color: "#3f3f46" }}>USDC CASH OFFICER</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 20, fontFamily: "Inter Tight", fontSize: 96, lineHeight: 0.95, letterSpacing: -4, color: "#18181b" }}>
          <span>Cash that comes back</span>
          <span>on time.</span>
        </div>

        <span style={{ marginTop: 36, fontFamily: "Chivo Mono", fontSize: 24, color: "#71717a" }}>SERV PLANS. CODE CHECKS. IXS BUILDS. YOU SIGN.</span>

        <svg width="1200" height="140" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: 10 }}>
          <path d={WAVE} fill="none" stroke="#94faf0" strokeWidth="4" />
        </svg>
        <svg width="1200" height="100" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: 0 }}>
          <path d={WAVE} fill="none" stroke="#bff660" strokeWidth="3" />
        </svg>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter Tight", data: display, style: "normal", weight: 500 },
        { name: "Chivo Mono", data: mono, style: "normal", weight: 400 },
      ],
    },
  );
}
