import type { Metadata } from "next";
import { pageMeta } from "@/lib/og";
import Link from "next/link";
import { DocPage } from "@/components/DocPage";
import { REPO_URL } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Privacy",
  description: "What Ebbryn collects, where it goes, how long it's kept and your choices.",
  path: "/privacy",
});

const TOC = [
  { id: "summary", label: "Summary" },
  { id: "who", label: "Who runs Ebbryn" },
  { id: "collect", label: "What we collect" },
  { id: "share", label: "Who receives it" },
  { id: "retention", label: "How long it's kept" },
  { id: "basis", label: "Why we process it" },
  { id: "rights", label: "Your choices and rights" },
  { id: "security", label: "Security" },
  { id: "changes", label: "Changes and contact" },
];

export default function PrivacyPage() {
  return (
    <DocPage
      label="Privacy"
      title="Privacy policy"
      intro={<p>Ebbryn has no accounts and no analytics. This page explains the little data that does move, and where it goes.</p>}
      updated="September 24, 2026"
      toc={TOC}
      footer={false}
    >
      <h2 id="summary">Summary</h2>
      <ul>
        <li>Your setup, plans and transaction hashes are stored in your own browser, not on our servers.</li>
        <li>When you ask for a plan, your balance, payouts and rules are sent to SERV Reasoning by OpenServ to produce it.</li>
        <li>When you review moves, your wallet address is sent to IXS to build the transactions.</li>
        <li>Your IP address is used briefly for rate limiting and appears in standard hosting logs.</li>
        <li>If you open Ebbryn through the link we shared with hackathon reviewers or a link in our GitHub README, a cookie marks that visit. Nobody else gets one.</li>
        <li>We never ask for your name, email, or private keys, and we don’t sell data.</li>
      </ul>

      <h2 id="who">Who runs Ebbryn</h2>
      <p>
        Ebbryn is an independent project built by MystiqueMide for the OpenServ SERV Hackathon. For privacy questions, open an issue on{" "}
        {REPO_URL ? <a href={`${REPO_URL}/issues`}>GitHub</a> : "GitHub"}. Don’t include anything sensitive in a public issue.
      </p>

      <h2 id="collect">What we collect</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>When</th>
              <th>Where it’s kept</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Balance, payouts, cash rules, hard limits</td>
              <td>You fill in Setup</td>
              <td>Your browser’s local storage. Sent to our server and SERV only when you ask for a plan.</td>
            </tr>
            <tr>
              <td>Plans and check results</td>
              <td>A plan finishes</td>
              <td>Your browser, and our server’s memory for 10 minutes so identical requests reuse it.</td>
            </tr>
            <tr>
              <td>Wallet address</td>
              <td>You connect a wallet and review moves</td>
              <td>Not stored by us. Sent to IXS and a public BNB Chain RPC to build transactions and read balances.</td>
            </tr>
            <tr>
              <td>Transaction hashes</td>
              <td>You sign a move</td>
              <td>Your browser, so progress survives a refresh. They’re public on the blockchain anyway.</td>
            </tr>
            <tr>
              <td>IP address</td>
              <td>You ask for a plan</td>
              <td>A rate-limit counter in Upstash Redis for up to 10 minutes. Also in our host’s request logs.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Ebbryn does not use tracking pixels or analytics. Fonts are served from our own domain.
      </p>
      <h3>Review links</h3>
      <p>
        If you open Ebbryn through the link we shared with hackathon reviewers, or through a link in our GitHub README, we set one cookie with a random ID for 30 days. While it’s set, the pages you view and whether your plans passed are sent to the maintainer’s Telegram, with your browser, operating system and country (from the hosting provider). This shows us what reviewers tried and whether it worked. It holds no name, email, wallet address or plan inputs. Visitors who arrive any other way get no cookie and are not tracked. Clear this site’s cookies to stop it.
      </p>

      <h2 id="share">Who receives it</h2>
      <p>These services process data on Ebbryn’s behalf or because you asked Ebbryn to reach them:</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>What it receives</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <a href="https://www.openserv.ai" target="_blank" rel="noreferrer">OpenServ</a> (SERV Reasoning)
              </td>
              <td>Balance, payouts, rules, limits and vault list</td>
              <td>
                To produce your plan. Ebbryn’s OpenServ account has data collection turned on, which the hackathon requires, so OpenServ may keep and use these requests under its own terms.
              </td>
            </tr>
            <tr>
              <td>
                <a href="https://www.ixs.finance" target="_blank" rel="noreferrer">IXS Finance</a>
              </td>
              <td>Wallet address and deposit amount</td>
              <td>To build the unsigned vault transactions</td>
            </tr>
            <tr>
              <td>BNB Chain RPC</td>
              <td>Wallet address</td>
              <td>To read your USDC, BNB and allowance, directly from your browser</td>
            </tr>
            <tr>
              <td>
                <a href="https://vercel.com" target="_blank" rel="noreferrer">Vercel</a>
              </td>
              <td>Standard request data, including IP address</td>
              <td>Hosting the site</td>
            </tr>
            <tr>
              <td>
                <a href="https://upstash.com" target="_blank" rel="noreferrer">Upstash</a>
              </td>
              <td>IP address inside a short-lived counter</td>
              <td>Rate limiting, to protect shared credits</td>
            </tr>
            <tr>
              <td>Your wallet provider</td>
              <td>Whatever your wallet collects under its own policy</td>
              <td>Signing transactions</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Transactions you sign are published on a public blockchain and can’t be deleted by anyone. Some of these services are based outside your country, including in the United States, so your data may be processed there.
      </p>

      <h2 id="retention">How long it’s kept</h2>
      <ul>
        <li>Browser storage: until you clear it or start over in Setup.</li>
        <li>Plan cache on our server: 10 minutes, and gone on every restart.</li>
        <li>Rate-limit counters: 10 minutes per IP. The daily total holds no personal data.</li>
        <li>Hosting logs: kept by Vercel for its standard log retention period.</li>
        <li>SERV requests: kept by OpenServ under its own policy.</li>
      </ul>

      <h2 id="basis">Why we process it</h2>
      <p>
        We process plan inputs and wallet addresses because you asked Ebbryn to make a plan or build moves. We use IP addresses for rate limiting and hosting because we have a legitimate interest in keeping a shared, free service available and protected from abuse.
      </p>

      <h2 id="rights">Your choices and rights</h2>
      <ul>
        <li>You can use every screen before Moves without connecting a wallet.</li>
        <li>You can delete everything Ebbryn stored on your device by clearing this site’s data in your browser.</li>
        <li>
          Depending on where you live, you may have the right to access, correct, delete or object to the processing of your personal data, and to complain to your data protection authority. Contact us through{" "}
          {REPO_URL ? <a href={`${REPO_URL}/issues`}>GitHub</a> : "GitHub"} and we’ll help with what we hold. For data held by OpenServ, IXS, Vercel or Upstash, you can also contact them directly.
        </li>
      </ul>
      <p>Ebbryn isn’t meant for anyone under 18.</p>

      <h2 id="security">Security</h2>
      <p>
        All traffic uses HTTPS. API keys stay on the server. Ebbryn never asks for your seed phrase or private key. If anything ever does, it isn’t us.
      </p>

      <h2 id="changes">Changes and contact</h2>
      <p>
        If this policy changes, we’ll update this page and the date at the top. Questions go to{" "}
        {REPO_URL ? <a href={`${REPO_URL}/issues`}>GitHub issues</a> : "GitHub issues"}. See also the <Link href="/terms">Terms</Link>.
      </p>
    </DocPage>
  );
}
