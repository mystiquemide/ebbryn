import OpenAI from "openai";
import type { CheckFailure, Limits, Plan, VaultInfo } from "./plan";
import type { Occurrence, Payout } from "./schedule";

export const SERV_BASE_URL = "https://inference-api.openserv.ai/v1";
export const SERV_MODEL = process.env.SERV_MODEL ?? "gpt-6-luna-serv-kronos-multipath";

const SHADOW_HINT =
  "Liquid plus parked must equal the balance. Every payout occurrence must be funded exactly once, by liquidFunds or by one redemption, never both. Never park in a vault whose acceptsDeposits is false.";

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["liquid", "liquidFunds", "parked", "redemptions", "reasons"],
  properties: {
    liquid: { type: "number", description: "USDC kept in the wallet" },
    liquidFunds: { type: "array", items: { type: "string" }, description: "Occurrence ids or payoutId@* covered by liquid cash" },
    parked: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["vaultId", "amount"],
        properties: { vaultId: { type: "string" }, amount: { type: "number" } },
      },
    },
    redemptions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["vaultId", "amount", "requestDate", "funds"],
        properties: {
          vaultId: { type: "string" },
          amount: { type: "number" },
          requestDate: { type: "string", description: "YYYY-MM-DD" },
          funds: { type: "array", items: { type: "string" } },
        },
      },
    },
    reasons: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "rule"],
        properties: {
          text: { type: "string", description: "One sentence with the amount and why" },
          rule: { type: "string", description: "The user rule or hard limit this satisfies, quoted" },
        },
      },
    },
  },
} as const;

export type PlanRequest = {
  balance: number;
  today: string;
  payouts: Payout[];
  occurrences: Occurrence[];
  rules: string;
  limits: Limits;
  vaults: VaultInfo[];
};

export type ServMeta = { requestId: string | null; model: string; features: string[]; tokens: number | null };

export class ServError extends Error {}

// Kept identical across requests so SERV can reuse its generated Kronos + Multipath reasoning prompt.
const SYSTEM_PROMPT = [
    "You are Ebbryn, a careful treasury officer for a business that holds USDC.",
    "Decide how much USDC stays liquid in the wallet and how much is parked in the listed IXS vaults, and when to request redemptions so money is back before each payout.",
    "Funding rules you must follow:",
    "- Every payout occurrence in the schedule is funded exactly once: either listed in liquidFunds or in the funds of exactly one redemption. Never both.",
    "- Use payoutId@* to fund every occurrence of a payout at once.",
    "- A redemption request lands after the vault's lagDays and must land at least 1 day before the earliest payout it funds.",
    "- liquid + total parked equals the balance exactly. Park only in vaults where acceptsDeposits is true.",
    "- Respect the hard limits exactly. If payouts exceed the balance, park nothing.",
    "- Each reason quotes the rule or limit it satisfies.",
    "Goal: idle cash earns nothing, so park as much as the rules and limits allow. Keep liquid only what near-term payouts and the buffer need, and fund later payouts with redemptions timed to land before them. A sync vault (lagDays 0) can be redeemed the day before a payout.",
    "The business's own cash rules come in the user message. Follow them unless they conflict with the hard limits, which always win.",
].join("\n");

function userMessage(req: PlanRequest, failures?: CheckFailure[]): string {
  const daily = req.payouts.filter((p) => p.repeat === "daily");
  const lumps = req.occurrences.filter((o) => !daily.some((d) => d.id === o.payoutId));
  const lines = [
    `Today: ${req.today}. Balance: ${req.balance} USDC.`,
    `The business's cash rules: ${req.rules.trim() || "Never be short for a payout."}`,
    `Hard limits: park at most ${req.limits.maxParkedPct}% of balance. Keep ${req.limits.minLiquidDays} extra days of daily spend liquid on top of the payouts liquid funds.`,
    "",
    "Payout occurrences (id, date, amount, label):",
    ...lumps.map((o) => `- ${o.id} | ${o.date} | ${o.amount} | ${o.label}`),
    ...daily.map((d) => {
      const n = req.occurrences.filter((o) => o.payoutId === d.id).length;
      return `- ${d.id}@* | daily x${n} | ${d.amount}/day, ${d.amount * n} total | ${d.label}`;
    }),
    "",
    "Vaults (id, name, network, settlement, lagDays, acceptsDeposits):",
    ...req.vaults.map((v) => `- ${v.id} | ${v.name} | ${v.network} | ${v.settlement} | ${v.lagDays} | ${v.acceptsDeposits}`),
  ];
  if (failures?.length) {
    lines.push("", "Your previous plan failed these checks. Fix every one:", ...failures.map((f) => `- ${f.code}: ${f.detail}`));
  }
  return lines.join("\n");
}

export async function requestPlan(req: PlanRequest, failures?: CheckFailure[]): Promise<{ plan: Plan; meta: ServMeta }> {
  const apiKey = process.env.SERV_API_KEY;
  if (!apiKey) throw new ServError("SERV_API_KEY is not set");
  const client = new OpenAI({ apiKey, baseURL: SERV_BASE_URL, timeout: 170_000, maxRetries: 0 });

  const started = Date.now();
  const call = client.chat.completions
    .create({
      model: SERV_MODEL,
      reasoning_effort: "low",
      max_completion_tokens: 6000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage(req, failures) },
      ],
      response_format: { type: "json_schema", json_schema: { name: "ebbryn_plan", strict: true, schema: PLAN_SCHEMA } },
      tools: [
        {
          type: "function",
          function: {
            name: "serv_shadow_agent",
            parameters: {
              type: "object",
              properties: {
                hint: { type: "string", default: SHADOW_HINT },
                max_iterations: { type: "integer", default: 2 },
              },
            },
          },
        },
      ],
    })
    .withResponse();
  let data: Awaited<typeof call>["data"];
  let response: Response;
  try {
    ({ data, response } = await call);
  } catch (e) {
    if (e instanceof OpenAI.APIConnectionTimeoutError) throw new ServError("SERV took too long to plan. Try again.");
    if (e instanceof OpenAI.APIError) throw new ServError(`SERV returned HTTP ${e.status}`);
    throw e;
  } finally {
    console.info(`serv plan ${Date.now() - started}ms${failures?.length ? " (retry)" : ""}`);
  }

  const choice = data.choices[0];
  if (choice?.finish_reason === "length") throw new ServError("SERV ran out of tokens before finishing the plan");
  const content = choice?.message?.content;
  if (!content) throw new ServError("SERV returned an empty plan");

  let plan: Plan;
  try {
    plan = JSON.parse(content) as Plan;
  } catch {
    throw new ServError("SERV returned a plan that is not valid JSON");
  }

  return {
    plan,
    meta: {
      requestId: response.headers.get("x-openserv-request-id"),
      model: SERV_MODEL,
      features: ["Kronos", "Multipath", "Shadow Agent", "strict JSON schema"],
      tokens: data.usage?.total_tokens ?? null,
    },
  };
}
