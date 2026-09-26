import type { Metadata } from "next";
import { pageMeta } from "@/lib/og";
import Link from "next/link";
import { DocPage } from "@/components/DocPage";
import { REPO_URL } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Terms",
  description: "The terms for using Ebbryn, a non-custodial testnet planner for USDC payouts.",
  path: "/terms",
});

const TOC = [
  { id: "agreement", label: "Agreement" },
  { id: "service", label: "What Ebbryn is" },
  { id: "custody", label: "No custody" },
  { id: "advice", label: "No financial advice" },
  { id: "testnet", label: "Testnet only" },
  { id: "responsibilities", label: "Your responsibilities" },
  { id: "third-parties", label: "Third-party services" },
  { id: "availability", label: "Availability and limits" },
  { id: "license", label: "Open source" },
  { id: "disclaimer", label: "Disclaimer" },
  { id: "liability", label: "Limitation of liability" },
  { id: "changes", label: "Changes and contact" },
];

export default function TermsPage() {
  return (
    <DocPage
      label="Terms"
      title="Terms of use"
      intro={<p>The short version: Ebbryn is an unaudited testnet tool. It proposes plans, you decide and sign, and you use it at your own risk.</p>}
      updated="September 24, 2026"
      toc={TOC}
    >
      <h2 id="agreement">Agreement</h2>
      <p>
        These terms apply to the Ebbryn website and API (“Ebbryn”), built by MystiqueMide. By using Ebbryn you agree to them. If you don’t agree, don’t use it. You must be at least 18 and allowed to use services like this where you live.
      </p>

      <h2 id="service">What Ebbryn is</h2>
      <p>
        Ebbryn is software that helps you plan how much USDC to keep ready and how much to park in IXS vaults. It sends your inputs to SERV Reasoning to draft a plan, checks that plan with fixed rules in code, and asks IXS to build unsigned transactions you can review and sign. Ebbryn was built for the OpenServ SERV Hackathon and is a demonstration, not a finished financial product.
      </p>

      <h2 id="custody">No custody</h2>
      <ul>
        <li>Ebbryn never holds, controls or has access to your funds, private keys or seed phrase.</li>
        <li>Nothing moves unless you sign it in your own wallet. Planned withdrawals don’t happen automatically.</li>
        <li>Transactions on a blockchain are final. Ebbryn can’t reverse, cancel or recover them.</li>
      </ul>

      <h2 id="advice">No financial advice</h2>
      <p>
        Plans are generated from the rules and numbers you enter. They are not financial, investment, legal or tax advice, and Ebbryn has no fiduciary duty to you. Yields, withdrawal timing and vault availability are set by third parties and can change. Any figures on the site, including the idle cash calculator, are illustrations based on your own assumptions.
      </p>

      <h2 id="testnet">Testnet only</h2>
      <p>
        Ebbryn works with testnet vaults and test tokens that have no real value. The code hasn’t been audited. Don’t use it with real funds or on mainnet. IXS’s mainnet vaults take real funds and are outside this build.
      </p>

      <h2 id="responsibilities">Your responsibilities</h2>
      <ul>
        <li>Check every transaction in your wallet before signing it.</li>
        <li>Keep your wallet and keys secure.</li>
        <li>Come back and sign each planned withdrawal on time if you want the money back before a payout.</li>
        <li>Don’t misuse Ebbryn: no attempts to overload it, get around its rate limits, attack it, or use it for anything unlawful.</li>
      </ul>

      <h2 id="third-parties">Third-party services</h2>
      <p>
        Ebbryn relies on services it doesn’t control, including SERV Reasoning by OpenServ, IXS Finance vaults and APIs, BNB Chain, your wallet provider, Vercel and Upstash. Their terms and policies apply to your use of them. Ebbryn isn’t responsible for their availability, accuracy, fees or behavior, or for the vaults and tokens they operate. How your data flows to them is described in the <Link href="/privacy">Privacy policy</Link>.
      </p>

      <h2 id="availability">Availability and limits</h2>
      <p>
        Ebbryn is free and offered as is. Planning is rate limited to protect shared credits, and it may pause when credits run out or a partner service is down. We may change, suspend or end Ebbryn at any time.
      </p>

      <h2 id="license">Open source</h2>
      <p>
        Ebbryn’s code is released under the MIT License{REPO_URL ? <> on <a href={REPO_URL}>GitHub</a></> : ""}. These terms cover the hosted site. Your use of the code itself is governed by that license.
      </p>

      <h2 id="disclaimer">Disclaimer</h2>
      <p>
        Ebbryn is provided “as is” and “as available”, without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose and non-infringement. We don’t promise that plans are correct, complete or suited to your situation, or that the service will be uninterrupted or error-free. The checks reduce errors but can’t rule them out.
      </p>

      <h2 id="liability">Limitation of liability</h2>
      <p>
        To the fullest extent allowed by law, MystiqueMide and contributors aren’t liable for any indirect, incidental, special or consequential damages, or for any loss of funds, tokens, data or profits, arising from your use of Ebbryn, a plan it produced, a transaction you signed, or a third-party service. Where liability can’t be excluded, it is limited to the amount you paid to use Ebbryn, which is zero. Some places don’t allow these limits, so parts of this section may not apply to you.
      </p>

      <h2 id="changes">Changes and contact</h2>
      <p>
        We may update these terms. The date at the top shows the latest version, and using Ebbryn after a change means you accept it. Questions go to{" "}
        {REPO_URL ? <a href={`${REPO_URL}/issues`}>GitHub issues</a> : "GitHub issues"}.
      </p>
    </DocPage>
  );
}
