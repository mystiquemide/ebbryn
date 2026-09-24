import type { Metadata } from "next";
import { Chivo_Mono, Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["500", "600"] });
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["500"] });
const chivoMono = Chivo_Mono({ variable: "--font-chivo-mono", subsets: ["latin"], weight: ["400"] });

export const metadata: Metadata = {
  title: "Ebbryn: cash that comes back on time",
  description:
    "Ebbryn parks the USDC you hold for payroll in IXS vaults and brings it back before payday. SERV plans it, code checks it, and you sign it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable} ${chivoMono.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
