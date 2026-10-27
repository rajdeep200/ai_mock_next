import Link from "next/link";
import { Arrow } from "./icons";

const yes = <span className="yes" aria-label="Included">✓</span>;
const no = <span className="no" aria-label="Not included">–</span>;

const ROWS: { label: string; free: React.ReactNode; starter: React.ReactNode; pro: React.ReactNode }[] = [
  { label: "Price per month", free: "₹0", starter: "₹599", pro: <><s style={{ fontWeight: 400, opacity: 0.6 }}>₹1249</s> ₹999</> },
  { label: "Interviews per month", free: "2", starter: "15", pro: "25" },
  { label: "Length of each interview", free: "Up to 15 min", starter: "Up to 30 min", pro: "Up to 45 min" },
  { label: "Voice AI interviewer", free: yes, starter: yes, pro: yes },
  { label: "Feedback report and score", free: yes, starter: yes, pro: yes },
  { label: "Company-specific patterns", free: no, starter: yes, pro: yes },
  { label: "Premium voice", free: no, starter: no, pro: yes },
  { label: "Export", free: no, starter: no, pro: yes },
  { label: "Full session history", free: no, starter: no, pro: yes },
];

export default function Plans() {
  return (
    <section className="plans sec" id="plans">
      <div className="wrap">
        <div className="sec-head reveal">
          <h2>Walk into your next interview <b>better prepared</b></h2>
          <p className="lede">Start free. Move up when you want more practice, longer sessions, or preparation aimed at the companies you&apos;re targeting.</p>
        </div>

        <div className="tiers">
          <article className="tier">
            <p className="kicker">Free</p>
            <h3>Try your first mock interview</h3>
            <p className="pitch">Explore AI-powered practice and get comfortable answering interview questions.</p>
            <span className="price">₹0<small> /month</small></span>
            <p className="limits">2 interviews · 15 minutes each</p>
            <p className="per"></p>
            <Link href="/dashboard" className="btn ghost">Start practicing free <Arrow /></Link>
          </article>

          <article className="tier">
            <p className="kicker">For regular practice</p>
            <h3>Starter</h3>
            <p className="pitch">Build consistency, improve your answers, and practice company-specific interview patterns.</p>
            <span className="price">₹599<small> /month</small></span>
            <p className="limits">15 interviews · 30 minutes each</p>
            <p className="per">About ₹39.93 per available session</p>
            <Link href="/pricing" className="btn ghost">Build my interview skills <Arrow /></Link>
          </article>

          <article className="tier pro">
            <span className="best-flag">Best value</span>
            <p className="kicker">For serious job seekers</p>
            <h3>Pro</h3>
            <p className="pitch">Practice more, run longer mock interviews, and prepare for the companies you&apos;re targeting.</p>
            <span className="price"><s className="was" aria-label="Original price ₹1249">₹1249</s> ₹999<small> /month</small></span>
            <span className="save"><b>20% off</b> launch offer · you save ₹250/month</span>
            <p className="limits">25 interviews · 45 minutes each · Every feature</p>
            <p className="per">About ₹39.96 per session, with longer sessions and every feature</p>
            <Link href="/pricing" className="btn">Get interview-ready with Pro <Arrow /></Link>
          </article>
        </div>
        <p className="plans-note">Per-session prices are the monthly price divided by the full monthly allocation. They don&apos;t assume you&apos;ll use every session.</p>

        <div className="gap">
          <h3>Pay ₹400 more for <b>substantially more practice</b></h3>
          <div className="side"><small>Starter · per month</small><strong>₹599</strong><span>15 interview sessions<br />Up to 30 minutes each</span></div>
          <div className="vs" aria-hidden="true">vs</div>
          <div className="side up"><small>Pro · per month</small><strong>₹999</strong><span>25 interview sessions<br />Up to 45 minutes each</span></div>
          <p className="why">Pro gives you 10 more sessions a month, each up to 15 minutes longer, plus every feature.</p>
        </div>

        <div className="compare">
          <h3>Compare the plans</h3>
          <div className="tbl-wrap">
            <table className="cmp">
              <caption className="sr" style={{ position: "absolute", left: -9999 }}>Feature comparison of the Free, Starter and Pro plans</caption>
              <thead>
                <tr>
                  <th scope="col"><span className="sr" style={{ position: "absolute", left: -9999 }}>Feature</span></th>
                  <th scope="col">Free</th>
                  <th scope="col">Starter</th>
                  <th scope="col" className="pro">Pro</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.label}>
                    <th scope="row">{r.label}</th>
                    <td>{r.free}</td>
                    <td>{r.starter}</td>
                    <td className="pro">{r.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
