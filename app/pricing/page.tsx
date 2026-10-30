import Link from "next/link";
import { bricolage, figtree } from "@/lib/fonts";
import "./pricing.css";
import PricingHeader from "@/component/pricing/PricingHeader";
import PricingClient from "@/component/pricing/PricingClient";
import HomeFooter from "@/component/home/HomeFooter";
import ScrollReveal from "@/component/home/ScrollReveal";
import { Arrow } from "@/component/home/icons";
import { PLANS } from "@/lib/plans";

const Yes = () => (
  <i className="y"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg></i>
);
const No = () => <i className="n" aria-label="Not included">–</i>;
const flag = (on: boolean) => (on ? <Yes /> : <No />);

const IDS = ["free", "starter", "pro"] as const;

const FAQS = [
  { q: "How are interviews counted?", a: "Each interview you start counts toward your plan's monthly limit. Usage is tracked per calendar month, and you can see where you stand at the top of this page." },
  { q: "What happens if I reach my limit?", a: "You can upgrade at any time to get a higher monthly limit and longer sessions. Session length is capped by your plan, so a longer interview needs a higher tier." },
  { q: "How does payment work?", a: "Payments are in INR and handled by Cashfree on their secure checkout. You're sent back to MockQube when it finishes, and your plan updates automatically." },
  { q: "Why do you need my phone number?", a: "It's used for payment verification only, so it must be added before you can upgrade. Digits only, 6 to 15 of them." },
];

export default function PricingPage() {
  return (
    <div className={`mqp ${bricolage.variable} ${figtree.variable}`}>
      <ScrollReveal />
      <PricingHeader />

      <section className="intro">
        <div className="disc" aria-hidden="true"></div>
        <div className="wrap">
          <p className="tag"><i aria-hidden="true"></i>Upgrade anytime</p>
          <h1>
            <span><em><b>Flexible pricing,</b></em></span>
            <span><em>same sharp interviewer</em></span>
          </h1>
          <p className="lede">Pick the plan that fits your prep. More interviews, longer sessions and company-style questions as you level up.</p>
        </div>
      </section>

      <PricingClient />

      <section className="compare sec">
        <div className="wrap">
          <div className="sec-head reveal"><h2>Compare <b>plans</b></h2></div>
          <div className="table reveal" role="table" aria-label="Plan comparison">
            <div className="row head" role="row">
              <span></span><span>Free</span><span>Starter</span><span className="pro-col">Pro</span>
            </div>
            <div className="row" role="row">
              <span>Interviews per month</span>
              {IDS.map((id) => <span key={id} className={id === "pro" ? "pro-col" : undefined}>{PLANS[id].monthlyInterviewCap}</span>)}
            </div>
            <div className="row" role="row">
              <span>Max minutes per interview</span>
              {IDS.map((id) => <span key={id} className={id === "pro" ? "pro-col" : undefined}>{PLANS[id].maxMinutesPerInterview}</span>)}
            </div>
            <div className="row" role="row">
              <span>Company-style questions</span>
              {IDS.map((id) => <span key={id}>{flag(PLANS[id].features.companyPatterns)}</span>)}
            </div>
            <div className="row" role="row">
              <span>Premium voice</span>
              {IDS.map((id) => <span key={id}>{flag(PLANS[id].features.premiumTTS)}</span>)}
            </div>
            <div className="row" role="row">
              <span>Export</span>
              {IDS.map((id) => <span key={id}>{flag(PLANS[id].features.export)}</span>)}
            </div>
            <div className="row" role="row">
              <span>Full history</span>
              {IDS.map((id) => <span key={id}>{flag(PLANS[id].features.fullHistory)}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head reveal"><h2>Good to <b>know</b></h2></div>
          <div className="faq reveal">
            {FAQS.map((f, i) => (
              <details key={f.q} open={i === 0}>
                <summary>{f.q}<i aria-hidden="true"></i></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="final">
        <div className="final-in">
          <h2>Not sure yet? <b>Start free.</b></h2>
          <p>Run your first mock round on the house, then upgrade when you want more.</p>
          <Link href="/start-interview" className="btn dark">Start Free Mock Interview<Arrow /></Link>
          <span className="note">
            Questions about billing? <Link href="/contact">Contact us</Link> · <Link href="/refund-policy">Refund policy</Link>
          </span>
        </div>
      </section>

      <HomeFooter />
    </div>
  );
}
