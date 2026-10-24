"use client";

import { useEffect } from "react";

// Adds the "in" class to section headings (.reveal) and the report block once they scroll into view.
export default function ScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".mq .reveal, .mq #reportBlock, .mqh .reveal, .mqp .reveal");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.2 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
