/* eslint-disable @next/next/no-img-element -- small static SVG logos */

const SPONSORS = [
  {
    name: "OpenServ",
    href: "https://www.openserv.ai",
    logo: (
      <span className="inline-flex items-center gap-2">
        <img src="/logos/openserv-mark.svg" alt="" width={30} height={30} />
        <span className="text-[22px] leading-none tracking-[-0.6px] text-ink">OpenServ</span>
      </span>
    ),
    role: "SERV Reasoning",
    body: "Plans every split. Kronos and Multipath keep a small model on your rules, and Shadow Agent checks each draft before Ebbryn's own checks run.",
  },
  {
    name: "IXS",
    href: "https://www.ixs.finance",
    logo: <img src="/logos/ixs.svg" alt="IXS" width={88} height={30} />,
    role: "RWA vaults",
    body: "Holds the parked cash. Ebbryn reads live vault status from IXS and gets every deposit transaction built by the IXS MCP server.",
  },
];

export function BuiltOn() {
  return (
    <section className="border-t border-steel" aria-labelledby="built-heading">
      <div className="container-page py-16 md:py-24">
        <p className="label">Built on</p>
        <h2 id="built-heading" className="display-section mt-5 max-w-[980px] text-ink">
          Two layers doing real work.
        </h2>
        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {SPONSORS.map((s) => (
            <li key={s.name}>
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full flex-col gap-6 rounded-[16px] bg-cloud p-6 transition-colors hover:bg-[#e9e9ec] md:p-8"
                style={{ boxShadow: "var(--shadow-cloud)" }}
                aria-label={`${s.name}, opens their site`}
              >
                <div className="flex items-center justify-between">
                  {s.logo}
                  <span className="num text-[12px] uppercase tracking-[0.24px] text-slate">{s.role}</span>
                </div>
                <p className="text-[16px] leading-[24px] text-charcoal">{s.body}</p>
                <span className="mt-auto text-[14px] text-ink underline-offset-4 group-hover:underline">
                  {s.href.replace("https://www.", "")}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
