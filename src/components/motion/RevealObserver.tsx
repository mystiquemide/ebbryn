"use client";

import { useEffect } from "react";

// Marks [data-reveal] elements with data-in as they scroll into view. Adds .motion to <html> first,
// so hidden start states only exist while this script runs. Also watches for elements that stream in
// later (the IXS vault list arrives after first paint), so nothing is left hidden.
export function RevealObserver() {
  useEffect(() => {
    const reveal = (el: Element) => el.setAttribute("data-in", "");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const all = () => Array.from(document.querySelectorAll("[data-reveal]:not([data-in])"));
    if (reduce || !("IntersectionObserver" in window)) {
      all().forEach(reveal);
      const mo = new MutationObserver(() => all().forEach(reveal));
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            reveal(e.target);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );
    const watched = new WeakSet<Element>();
    const track = () => {
      for (const el of all()) {
        if (watched.has(el)) continue;
        watched.add(el);
        io.observe(el);
      }
    };

    // Anything already on screen shows at once, so there's no flash on load.
    const vh = window.innerHeight;
    all().forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.9) reveal(el);
    });
    document.documentElement.classList.add("motion");
    track();
    const mo = new MutationObserver(track);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
