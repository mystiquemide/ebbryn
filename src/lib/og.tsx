import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Metadata } from "next";
import { ImageResponse } from "next/og";

// Shared-link cards and metadata. Every page's card uses the same layout as the landing card,
// with its own label, headline and tagline.
export const OG_SIZE = { width: 1200, height: 630 };

const SITE = "Ebbryn";
const WAVE = "M0 60 C 150 20, 450 20, 600 60 S 1050 100, 1200 60";

export async function renderCard({ label, lines, tagline }: { label: string; lines: string[]; tagline: string }) {
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
          <span style={{ fontFamily: "Chivo Mono", fontSize: 22, letterSpacing: 0.5, color: "#3f3f46" }}>{label}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 20, fontFamily: "Inter Tight", fontSize: 96, lineHeight: 0.95, letterSpacing: -4, color: "#18181b" }}>
          {lines.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>

        <span style={{ marginTop: 36, fontFamily: "Chivo Mono", fontSize: 24, color: "#71717a" }}>{tagline}</span>

        <svg width="1200" height="140" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: 10 }}>
          <path d={WAVE} fill="none" stroke="#94faf0" strokeWidth="4" />
        </svg>
        <svg width="1200" height="100" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: 0 }}>
          <path d={WAVE} fill="none" stroke="#bff660" strokeWidth="3" />
        </svg>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter Tight", data: display, style: "normal", weight: 500 },
        { name: "Chivo Mono", data: mono, style: "normal", weight: 400 },
      ],
    },
  );
}

/** Title, description and share tags for one page. The card image comes from the page's opengraph-image file. */
export function pageMeta({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  const full = `${title} · ${SITE}`;
  return {
    title: full,
    description,
    openGraph: { type: "website", siteName: SITE, title: full, description, url: path },
    twitter: { card: "summary_large_image", title: full, description },
  };
}
