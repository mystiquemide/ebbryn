"use client";

import Link from "next/link";
import { useState } from "react";
import { REPO_URL } from "@/lib/site";
import { Wordmark } from "./TideMark";

const LANDING_LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#vaults", label: "Vaults" },
];

const STEPS = [
  { n: 1, href: "/setup", label: "Setup" },
  { n: 2, href: "/plan", label: "Plan" },
  { n: 3, href: "/moves", label: "Moves" },
];

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StepRail({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-6" aria-label="Progress">
      {STEPS.map((s) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <li key={s.n} className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className="num grid h-5 w-5 place-items-center rounded-[6px] text-[12px]"
              style={{
                background: active ? "#94faf0" : done ? "#bff660" : "#f4f4f5",
                color: "#18181b",
              }}
            >
              {done ? "✓" : s.n}
            </span>
            <span style={{ color: active || done ? "#18181b" : "#71717a" }}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function SiteNav({ step }: { step?: 1 | 2 | 3 }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-steel bg-paper">
      <nav className="container-page flex h-[72px] items-center justify-between gap-6" aria-label="Main">
        <Link href="/" aria-label="Ebbryn home" className="shrink-0">
          <Wordmark />
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          {step ? (
            <StepRail current={step} />
          ) : (
            <ul className="flex items-center gap-8">
              {LANDING_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-3">
          {REPO_URL && (
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="btn btn-dev hidden sm:inline-flex">
              GitHub
            </a>
          )}
          {!step && (
            <Link href="/setup" className="btn btn-dark">
              Plan my cash
              <Arrow />
            </Link>
          )}
          {!step && (
            <button
              type="button"
              className="btn btn-soft px-3 md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                {open ? (
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                ) : (
                  <path d="M2.5 5h11M2.5 11h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                )}
              </svg>
            </button>
          )}
        </div>
      </nav>

      {step && (
        <div className="container-page pb-4 md:hidden">
          <StepRail current={step} />
        </div>
      )}

      {!step && open && (
        <div id="mobile-menu" className="border-t border-steel md:hidden">
          <ul className="container-page flex flex-col py-2">
            {LANDING_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="block py-3 text-[16px] text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
            {REPO_URL && (
              <li>
                <a href={REPO_URL} target="_blank" rel="noreferrer" className="block py-3 text-[16px] text-ink">
                  GitHub
                </a>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}

export { Arrow };
