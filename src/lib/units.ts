export const USDC_DECIMALS = 6;

const DECIMAL_RE = /^\d+(\.\d+)?$/;

// Converts a decimal amount to integer base units using string math, so no float error reaches the chain.
export function toBaseUnits(amount: number | string, decimals = USDC_DECIMALS): string {
  const text = typeof amount === "number" ? amount.toFixed(decimals) : amount.trim();
  if (!DECIMAL_RE.test(text)) throw new Error(`Invalid amount: ${amount}`);
  const [whole, frac = ""] = text.split(".");
  if (frac.length > decimals && /[1-9]/.test(frac.slice(decimals))) {
    throw new Error(`Amount has more than ${decimals} decimals: ${amount}`);
  }
  const units = BigInt(whole + frac.slice(0, decimals).padEnd(decimals, "0"));
  return units.toString();
}

export function fromBaseUnits(units: string | bigint, decimals = USDC_DECIMALS): number {
  const value = BigInt(units);
  const scale = BigInt(10) ** BigInt(decimals);
  const whole = value / scale;
  const frac = (value % scale).toString().padStart(decimals, "0");
  return Number(`${whole}.${frac}`);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatUsdc(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
