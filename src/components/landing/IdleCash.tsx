"use client";

import { useId, useState } from "react";

function parse(v: string): number | null {
  const n = Number(v.replace(/,/g, "").trim());
  return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
}

const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function Field({
  label,
  value,
  onChange,
  suffix,
  width,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix: string;
  width: string;
  max: number;
}) {
  const id = useId();
  const n = parse(value);
  const bad = n === null || n > max;
  return (
    <span className="inline-flex items-baseline gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={bad}
        className="num rounded-[12px] border bg-paper px-3 py-2 text-right text-[20px] text-ink outline-none focus:border-ink"
        style={{ width, borderColor: bad ? "#b3261e" : "#d4d4d8" }}
      />
      <span className="text-charcoal">{suffix}</span>
    </span>
  );
}

// The cost of idle cash, from the visitor's own numbers. Formula shown so nothing is taken on trust.
export function IdleCash() {
  const [amount, setAmount] = useState("180,000");
  const [days, setDays] = useState("14");
  const [rate, setRate] = useState("5");

  const a = parse(amount);
  const d = parse(days);
  const r = parse(rate);
  const valid = a !== null && d !== null && r !== null && d <= 31 && r <= 50;
  const lost = valid ? a * (r / 100) * ((d * 12) / 365) : null;

  return (
    <section className="container-page py-20 md:py-28" aria-labelledby="idle-heading">
      <p className="label">Idle cash</p>
      <h2 id="idle-heading" className="display-section mt-5 max-w-[980px] text-ink">
        Money waiting for payday earns nothing.
      </h2>
      <p className="mt-5 max-w-[560px] text-[18px] leading-[27px] text-slate">
        USDC sitting idle doesn&apos;t earn yield on its own. Put in your own numbers.
      </p>

      <div className="mt-10 rounded-[16px] bg-cloud p-6 md:p-10" style={{ boxShadow: "var(--shadow-cloud)" }}>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-4 text-[18px] leading-[44px] text-charcoal">
          <Field label="USDC waiting for payouts" value={amount} onChange={setAmount} suffix="USDC waits" width="160px" max={1_000_000_000} />
          <Field label="Days a month it waits" value={days} onChange={setDays} suffix="days a month, at" width="72px" max={31} />
          <Field label="Yearly rate you could earn" value={rate} onChange={setRate} suffix="% a year" width="72px" max={50} />
        </p>

        <div className="mt-8 border-t border-steel pt-8">
          {lost !== null ? (
            <>
              <p className="num mb-3 text-[12px] uppercase tracking-[0.24px] text-slate">Illustrative estimate</p>
              <p className="num text-[40px] leading-none tracking-[-1px] text-ink md:text-[56px]">
                {fmt(lost)} <span className="block pt-2 text-[20px] text-slate sm:inline sm:pt-0 md:text-[24px]">USDC a year</span>
              </p>
              <p className="mt-3 text-[16px] text-charcoal">is what that cash isn&apos;t earning.</p>
              <p className="num mt-6 text-[13px] text-slate">
                {fmt(a!, 0)} × {fmt(r!, r! % 1 ? 2 : 0)}% × ({fmt(d!, 0)} × 12 ÷ 365 days)
              </p>
            </>
          ) : (
            <p className="text-[16px] text-alert">
              Check the numbers: an amount, 0 to 31 days a month, and a rate from 0 to 50%.
            </p>
          )}
        </div>

        <p className="mt-6 text-[13px] text-slate">The starting numbers are an example. Change any of them. The rate is your assumption, not a quoted IXS vault return. Fees and withdrawal timing aren&apos;t included.</p>
      </div>
    </section>
  );
}
