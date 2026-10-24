import type { ReactNode } from "react";

export type PlanFeature = { text: string; on: boolean };

type Props = {
  variant: "free" | "starter" | "pro";
  name: string;
  blurb: string;
  price: string;
  features: PlanFeature[];
  badge?: { kind: "current" | "popular" | "hot"; label: string };
  current?: boolean;
  cta: ReactNode;
};

const Tick = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
);

const Star = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg>
);

export default function PlanCard({ variant, name, blurb, price, features, badge, current, cta }: Props) {
  const badgeCls = badge?.kind === "current" ? "cur" : badge?.kind === "hot" ? "hot" : "";
  return (
    <article className={`card ${variant}${current ? " current" : ""}`}>
      {badge && (
        <span className={`badge ${badgeCls}`}>
          {badge.kind === "current" && <Tick />}
          {badge.kind === "hot" && <Star />}
          {badge.label}
        </span>
      )}
      <h2 className="name">{name}</h2>
      <p className="blurb">{blurb}</p>
      <div className="price"><b>{price}</b><span>/ mo</span></div>
      <hr />
      <ul className="feat">
        {features.map((f) => (
          <li key={f.text} className={f.on ? undefined : "off"}>
            <span className="tick">{f.on && <Tick />}</span>
            {f.text}
          </li>
        ))}
      </ul>
      {cta}
    </article>
  );
}
