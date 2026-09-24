# Ebbryn

Cash that comes back on time.

Businesses that hold USDC for payroll keep weeks of it sitting idle, and USDC earns nothing on its own. Parking it somewhere that pays is easy. Getting it back before payday, every time, is the part nobody wants to trust to a guess. Ebbryn plans that, checks the plan in code, and leaves every transaction for you to sign.

There is no personal payroll receipt behind this project. The proof below is what Ebbryn actually did with real SERV and IXS calls on Sep 24, 2026.

## One line

Not a yield dashboard, not an auto-investing bot, and not an AI that moves money: a planner where a model proposes, deterministic code decides whether the plan is allowed, and nothing reaches a wallet without your signature.

## How it works

You list your payouts and write your cash rules in plain English.
SERV Reasoning (OpenServ) proposes how much stays ready and how much is parked in IXS vaults, with withdrawal dates.
Eight checks in code reject any plan that double counts, breaks a hard limit or lands money too late.
IXS builds the transactions, and you approve and deposit from your own wallet.

| Step | Who | What happens |
|---|---|---|
| Setup | You | Balance, payouts, plain-English rules, two hard limits (max % parked, extra buffer days) |
| Plan | SERV | `gpt-6-luna-serv-kronos-multipath` with strict JSON schema and Shadow Agent returns a split and reasons |
| Check | Ebbryn | 8 checks run on every plan. A failing plan is shown with its failures and moves stay locked |
| Sign plan | Ebbryn | A passing plan is HMAC-signed so it can't be edited before moves are built |
| Build | IXS | IXS MCP returns unsigned approve and deposit transactions for the open vault |
| Sign | You | Approve exactly the deposit amount, then deposit. Later withdrawals are yours to sign too |

## Try it in 2 minutes

Live at https://ebbryn.vercel.app (testnet). Planning uses shared SERV credits and is rate limited. Open it, or run it yourself (see the last section), then:

1. Open `/` and scroll to "Why code checks the model". It runs the real checks against a recorded SERV plan that counted payroll twice.
2. Click **Plan my cash**, keep the Payroll team template, click **Plan my cash** again. A live SERV plan comes back in about 25 to 70 seconds with a tide chart, SERV's reasons and 8 check tiles.
3. Edit a rule, for example "keep at least half the balance ready", and plan again. The reasons quote the rule you changed.
4. Click **View a plan Ebbryn rejected** to see the recorded failure with moves locked.
5. Click **Review moves**, connect a browser wallet on BSC testnet, and see the exact approve and deposit Ebbryn would ask you to sign, with balance, gas and network checks.

## Proof

| Case | Outcome | Proof |
|---|---|---|
| SERV counts the same payroll twice | Rejected by `COVER_ONCE` and `LIQUID_COVER`, 2 failed and 6 passed, nothing signable | [`src/fixtures/serv-double-count.json`](src/fixtures/serv-double-count.json), [`check.test.ts`](src/lib/check.test.ts) |
| SERV plan that should pass | 8 of 8 checks, 81,600 ready, 46,800 parked, 42,000 withdrawn Oct 14 for the Oct 15 payroll | SERV request `0520d265-1c98-4539-98f3-d0cf7f4d3173`, [`src/fixtures/serv-plan-payroll.json`](src/fixtures/serv-plan-payroll.json) |
| Rules text says "park 100%" | `CAP` fails, hard limits win over the rules | [`check.test.ts`](src/lib/check.test.ts) |
| Plan edited in the browser before signing | `/api/moves` returns 400, no transactions built | [`guard.test.ts`](src/lib/guard.test.ts), [`src/app/api/moves/route.ts`](src/app/api/moves/route.ts) |
| Planning spammed from one IP | 429 after 5 plans in 10 minutes, daily cap 200 | [`guard.test.ts`](src/lib/guard.test.ts) |
| Amount conversion | 75,600 USDC becomes `75600000000` base units, no float error | [`units.test.ts`](src/lib/units.test.ts) |
| Tide chart honesty | Wallet never negative, ready + parked + paid always equals the balance | [`timeline.test.ts`](src/lib/timeline.test.ts) |
| IXS approve amount | Decoded from the real IXS `approve` call and matched to the deposit before the UI says "exactly" | [`src/lib/wallet.ts`](src/lib/wallet.ts) `decodeApprove` |
| IXS returns a transaction for another contract | Blocked, nothing to sign | [`src/app/api/moves/route.ts`](src/app/api/moves/route.ts) |

## Live integrations

| Integration | Where | Status |
|---|---|---|
| SERV Reasoning API | `https://inference-api.openserv.ai/v1`, called from [`src/lib/serv.ts`](src/lib/serv.ts) | Live, request ids above |
| IXS vault discovery | `https://api-dev-v2.ixs.finance/vaults` | Live |
| IXS MCP | `https://api-dev-v2.ixs.finance/mcp`, `vault_get`, `vault_build_request_deposit` | Live |
| Target vault | IXHYB - BSC `0xCb09a5326AEFD705d14FF4C5ca2beD7086ba0Dcc`, BSC testnet (97), settles instantly | Open for deposits |
| Test wallet | `0xF4905CfAd9AEf6fbB1B11A82C76905f6e73842E8` | 0.01 test BNB, 0 IXS test USDC |

Things found and reported to IXS while building, in [IXS-Finance/ixs-rwa-agent-skills#5](https://github.com/IXS-Finance/ixs-rwa-agent-skills/issues/5): the Arc and Fuji vaults accept no deposits, `vault_request_status` errors, parallel MCP calls hang, and `vaults_list` returns a subset. Ebbryn queues MCP calls one at a time and reads discovery from REST because of this.

## How this differs

| Alternative | What it does | Why Ebbryn is different |
|---|---|---|
| Earn features in wallets and neobanks | Park a balance at a single rate | Ebbryn plans around your payout dates and brings money back before each one |
| Payroll platforms with built-in yield | Yield on float inside one platform | Works with any USDC wallet and any payout schedule you type in |
| Agent wallets with threshold sweeping | Move balance above a threshold | Ebbryn reasons over dates and rules, and code checks every plan |
| "AI treasury" agents | A model decides and executes | The model only proposes. Code gates it and you sign every transaction |

## Honest limitations

- Unaudited hackathon code. Testnet only. Don't use it with real funds.
- No deposit has been signed on chain yet. The IXS test USDC can only be minted by IXS, and the request is open in issue #5. The approve and deposit are built by IXS and checked, but not broadcast.
- Withdrawals are planned, not automated. On the withdrawal date you come back and sign it. There are no reminders yet.
- SERV plans take 25 to 70 seconds. Identical inputs within 10 minutes reuse the last plan.
- Mainnet IXS vaults require IXS verification (KYC). Only testnet vaults are used here.
- Rate limits and the plan cache are in memory and reset when the server restarts.
- Your setup and plans live in your browser's local storage. There are no accounts.

## What's real

The SERV and IXS calls are real and there is no mock data in the app. The only recorded data is the SERV plan that failed its checks and one that passed, both labelled as recorded wherever they appear, plus a committed snapshot of the IXS vault list shown only when IXS is unreachable, with its timestamp. The model proposes, and the eight checks in [`src/lib/check.ts`](src/lib/check.ts) decide. 36 tests pass with `npm test`.

## Run locally

```bash
git clone https://github.com/mystiquemide/ebbryn.git && cd ebbryn
npm install
cp .env.example .env.local   # set SERV_API_KEY and a 32+ character PLAN_SIGNING_SECRET
npm test
npm run build && npm start
```

Built on SERV Reasoning by OpenServ and IXS vaults.
