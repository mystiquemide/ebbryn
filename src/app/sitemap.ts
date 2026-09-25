import type { MetadataRoute } from "next";

const BASE = "https://ebbryn.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/setup", "/docs", "/terms", "/privacy"].map((path) => ({ url: `${BASE}${path}` }));
}
