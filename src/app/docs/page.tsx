import type { Metadata } from "next";
import { pageMeta } from "@/lib/og";
import Link from "next/link";
import { DocPage } from "@/components/DocPage";
import { CHECK_PLAIN } from "@/lib/checkCopy";
import type { CheckCode } from "@/lib/plan";
import { REPO_URL } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Docs",
  description: "How to plan USDC payouts with Ebbryn: quickstart, how the plan and checks work, wallet setup, API reference and troubleshooting.",
  path: "/docs",
});

const TOC = [
  { id: "quickstart", label: "Quickstart" },
  { id: "concepts", label: "How Ebbryn works" },
  { id: "checks", label: "The eight checks" },
  { id: "guides", label: "Guides" },
  { id: "reference", label: "Reference" },
  { id: "api", label: "API" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "faq", label: "FAQ" },
];

const CHECKS: CheckCode[] = ["SUM", "CAP", "CLOSED", "COVER_ONCE", "LIQUID_COVER", "TIMING", "REDEEM_LE_PARKED", "SHORTFALL"];

export default function DocsPage() {
  return (
    <DocPage
      label="Docs"
      title="Using Ebbryn"
      intro={<p>Everything you need to plan your USDC payouts, understand why a plan passes or fails, and sign the moves from your own wallet.</p>}
      toc={TOC}
    >
      <h2 id="quickstart">Quickstart</h2>
      <p>Your first plan takes a few minutes and needs no wallet.</p>
      <ol>
        <li>
          Open <Link href="/setup">Setup</Link> and pick the <strong>Payroll team</strong> template. It fills in a 128,400 USDC balance, contractor payroll on the 1st and 15th, and a daily agent top-up.
        </li>
        <li>Read the cash rules and hard limits. Change anything you like. The template is an example, never your data.</li>
        <li>
          Click <strong>Plan my cash</strong>. SERV Reasoning drafts a plan and Ebbryn runs its eight checks. This usually takes under a minute, and can take up to two.
        </li>
        <li>On the plan, read the split, the 30-day chart and SERV’s reasons. Each reason quotes the rule it follows.</li>
        <li>
          Click <strong>Review moves</strong> to see the exact deposit you would sign. Connecting a wallet is optional until you want to sign.
        </li>
      </ol>
      <p>
        Want to see the checks catch a bad plan first? Open the <Link href="/plan?case=recorded">recorded plan Ebbryn rejected</Link>.
      </p>

      <h2 id="concepts">How Ebbryn works</h2>
      <p>
        Ebbryn splits your USDC into two parts. <strong>Ready</strong> cash stays in your wallet for payouts that are close. <strong>Parked</strong> cash goes into an IXS real-world-asset vault, and Ebbryn plans a <strong>withdrawal</strong> so it’s back in your wallet at least a day before the payout it funds.
      </p>
      <h3>Who decides what</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Step</th>
              <th>Who</th>
              <th>What happens</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Plan</td>
              <td>SERV Reasoning</td>
              <td>Weighs your rules, payout dates and how long each vault takes to pay out, then proposes the split and withdrawal dates.</td>
            </tr>
            <tr>
              <td>Check</td>
              <td>Ebbryn’s code</td>
              <td>Runs eight fixed checks. If one fails, SERV gets one retry with the failures. If it still fails, moves stay locked.</td>
            </tr>
            <tr>
              <td>Build</td>
              <td>IXS</td>
              <td>Builds the unsigned approve and deposit transactions for the vault.</td>
            </tr>
            <tr>
              <td>Sign</td>
              <td>You</td>
              <td>Every transaction is signed in your own wallet. Ebbryn never holds keys or funds.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3>Rules and hard limits</h3>
      <p>
        Your <strong>cash rules</strong> are plain English, for example “Keep 3 days of agent spend ready.” SERV reads them and explains how it followed them. Your two <strong>hard limits</strong> are numbers that code enforces: the most you’ll park, as a percentage of your balance, and extra days of daily spend kept ready. If a rule and a hard limit disagree, the hard limit wins.
      </p>
      <h3>Withdrawals don’t happen by themselves</h3>
      <p>
        A planned withdrawal is a date, not an automatic action. On that date you come back to Ebbryn and sign it. Use <strong>Add to calendar</strong> on the plan or moves screen so you don’t miss it.
      </p>
      <h3>Why a plan can be trusted</h3>
      <ul>
        <li>Every passing plan is signed by the server, so it can’t be edited in the browser before moves are built.</li>
        <li>Before building moves, Ebbryn checks the live vaults again. If a vault closed since you planned, you’re asked to replan.</li>
        <li>Ebbryn only accepts transactions aimed at the vault and USDC contracts it expects, and checks that the approval is exactly the deposit amount.</li>
      </ul>

      <h2 id="checks">The eight checks</h2>
      <p>Every plan passes all eight, or nothing can be signed.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Check</th>
              <th>What it means</th>
            </tr>
          </thead>
          <tbody>
            {CHECKS.map((c) => (
              <tr key={c}>
                <td>
                  <strong>{CHECK_PLAIN[c].title}</strong>
                  <br />
                  <code>{c}</code>
                </td>
                <td>{CHECK_PLAIN[c].meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="guides">Guides</h2>
      <h3>Write cash rules that work</h3>
      <ul>
        <li>Name the payout: “Never be short for contractor payroll” beats “be safe”.</li>
        <li>Use numbers: “keep at least half the balance ready” or “keep 5 days of agent spend ready”.</li>
        <li>Put anything that must never be broken in the hard limits, not the rules text. Code enforces limits exactly.</li>
      </ul>
      <h3>Add your own payouts</h3>
      <ol>
        <li>On Setup, pick <strong>Blank</strong> or edit a template.</li>
        <li>For each payout, set a name, an amount in USDC, a first date and how often it repeats: <strong>One time</strong>, <strong>Every day</strong>, or <strong>1st and 15th</strong>.</li>
        <li>You can add up to 20 payouts. Ebbryn plans the next 30 days.</li>
      </ol>
      <h3>Connect a wallet on BSC testnet</h3>
      <ol>
        <li>Install a browser wallet such as <a href="https://metamask.io" target="_blank" rel="noreferrer">MetaMask</a>.</li>
        <li>On Moves, click <strong>Connect wallet</strong>. Ebbryn asks your wallet to switch to BSC testnet (chain 97) and adds it if needed.</li>
        <li>
          Get a little test BNB for network fees from the <a href="https://www.bnbchain.org/en/testnet-faucet" target="_blank" rel="noreferrer">BNB Chain testnet faucet</a>.
        </li>
        <li>You also need IXS test USDC. Only IXS can issue it, so without it you can review the moves but not send them.</li>
      </ol>
      <h3>Sign the moves</h3>
      <ol>
        <li>
          <strong>Approve USDC.</strong> This lets the vault take exactly the deposit amount. Skipped if your wallet already approved enough.
        </li>
        <li>
          <strong>Deposit USDC.</strong> This parks the money in the IXS vault. Each transaction links to the block explorer once confirmed.
        </li>
      </ol>

      <h2 id="reference">Reference</h2>
      <div className="table-wrap">
        <table>
          <tbody>
            <tr>
              <th>Planning window</th>
              <td>Next 30 days from today</td>
            </tr>
            <tr>
              <th>Payouts per plan</th>
              <td>Up to 20</td>
            </tr>
            <tr>
              <th>Park at most</th>
              <td>0 to 100% of the balance</td>
            </tr>
            <tr>
              <th>Extra days kept ready</th>
              <td>0 to 30 days of daily spend</td>
            </tr>
            <tr>
              <th>Planning limit</th>
              <td>5 plans per visitor every 10 minutes, 200 plans a day across everyone. The same inputs within 10 minutes reuse the last plan.</td>
            </tr>
            <tr>
              <th>Model</th>
              <td>
                <code>gpt-6-luna-serv-kronos-multipath</code> with Shadow Agent, via SERV Reasoning by OpenServ
              </td>
            </tr>
            <tr>
              <th>Vault</th>
              <td>IXHYB - BSC on BSC testnet (chain 97). Withdraw anytime.</td>
            </tr>
            <tr>
              <th>Network</th>
              <td>Testnet only. Mainnet IXS vaults require IXS verification.</td>
            </tr>
            <tr>
              <th>Your data</th>
              <td>
                Setup, plans and transaction hashes are saved in this browser only. See <Link href="/privacy">Privacy</Link>.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="api">API</h2>
      <p>The app runs on three JSON endpoints you can call directly.</p>
      <h3>
        <code>GET /api/vaults</code>
      </h3>
      <p>Live IXS vaults with network, withdrawal timing and whether each accepts deposits right now.</p>
      <h3>
        <code>POST /api/plan</code>
      </h3>
      <p>Returns a plan, SERV’s reasons, the result of every check and, if all pass, a signature. Counts toward the planning limit.</p>
      <pre>
        <code>{`curl -X POST https://ebbryn.midelabs.xyz/api/plan \\
  -H 'content-type: application/json' \\
  -d '{
    "balance": 128400,
    "payouts": [
      {"id": "payroll", "label": "Contractor payroll", "amount": 42000,
       "date": "2026-10-01", "repeat": "semimonthly"},
      {"id": "agents", "label": "Agent fleet top-up", "amount": 1200,
       "date": "2026-09-24", "repeat": "daily"}
    ],
    "rules": "Never be short for payroll. Keep 3 days of agent spend ready.",
    "limits": {"maxParkedPct": 60, "minLiquidDays": 3}
  }'`}</code>
      </pre>
      <p>
        <code>repeat</code> is <code>none</code>, <code>daily</code> or <code>semimonthly</code> (the 1st and 15th).
      </p>
      <h3>
        <code>POST /api/moves</code>
      </h3>
      <p>
        Takes the <code>inputs</code>, <code>plan</code> and <code>signature</code> from <code>/api/plan</code> plus your wallet address as <code>owner</code>, and returns the unsigned IXS transactions. A plan that was edited or no longer passes against live vaults is rejected.
      </p>
      {REPO_URL && (
        <p>
          Source, tests and setup are on <a href={REPO_URL}>GitHub</a>.
        </p>
      )}

      <h2 id="troubleshooting">Troubleshooting</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>You see</th>
              <th>What to do</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>“Planning is paused for a few minutes to protect shared credits.”</td>
              <td>You hit the planning limit. The screen counts down until you can plan again.</td>
            </tr>
            <tr>
              <td>“Planning is paused while Ebbryn’s SERV credits are topped up.”</td>
              <td>The shared SERV balance ran out. Nothing was changed. Try again later.</td>
            </tr>
            <tr>
              <td>“IXS didn’t answer in time…”</td>
              <td>The IXS testnet API was slow. Wait a minute and try again.</td>
            </tr>
            <tr>
              <td>The plan didn’t pass</td>
              <td>Read the failed checks, adjust your rules or limits, and plan again. Nothing can be signed from a failed plan.</td>
            </tr>
            <tr>
              <td>Moves asks you to replan</td>
              <td>A vault changed since you planned, or the plan is from an older session. Plan again.</td>
            </tr>
            <tr>
              <td>Not enough USDC or BNB</td>
              <td>Your wallet needs IXS test USDC for the deposit and a little test BNB for fees.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="faq">FAQ</h2>
      <h3>Does Ebbryn hold my money?</h3>
      <p>No. You sign every transaction in your own wallet, and Ebbryn never sees your keys.</p>
      <h3>Is this financial advice?</h3>
      <p>No. Ebbryn turns the rules you set into a proposed schedule. You decide whether to sign anything.</p>
      <h3>Can I use real funds?</h3>
      <p>No. Ebbryn is a testnet build for the OpenServ SERV Hackathon and hasn’t been audited.</p>
      <h3>Why does planning take up to two minutes?</h3>
      <p>SERV reasons over your rules and a second agent reviews the draft before it’s returned. If a request stalls, Ebbryn sends a second one and uses whichever finishes first.</p>
      <h3>What if SERV makes a mistake?</h3>
      <p>
        That’s what the checks are for. In testing, SERV once funded the same payroll twice. The checks rejected it and nothing could be signed.
      </p>
    </DocPage>
  );
}
