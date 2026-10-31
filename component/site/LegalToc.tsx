"use client";

import { useEffect, useState } from "react";

type Item = { id: string; label: string };

const slug = (s: string) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// "On this page" list, built from the <section><h2> blocks inside .doc, with the current section highlighted.
export default function LegalToc() {
  const [items, setItems] = useState<Item[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".doc section"));
    const found: Item[] = [];
    sections.forEach((s) => {
      const label = s.querySelector("h2")?.textContent?.trim();
      if (!label) return;
      const id = s.id || `s-${slug(label)}`;
      s.id = id;
      found.push({ id, label });
    });
    setItems(found);

    const onScroll = () => {
      let cur = 0;
      sections.forEach((s, i) => { if (s.getBoundingClientRect().top < 140) cur = i; });
      setCurrent(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <aside className="toc" aria-label="On this page">
      <h4>On this page</h4>
      <ol>
        {items.map((it, i) => (
          <li key={it.id}>
            <a href={`#${it.id}`} className={i === current ? "on" : undefined}>{it.label}</a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
