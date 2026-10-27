import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./home.css";
import AppHeader from "@/component/home/AppHeader";
import HomeFooter from "@/component/home/HomeFooter";
import ScrollReveal from "@/component/home/ScrollReveal";
import HeroCube from "@/component/home/HeroCube";
import { Arrow, MicIcon, TrendIcon, ClockIcon } from "@/component/home/icons";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["300", "500", "700"],
  variable: "--font-bricolage",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-figtree",
  display: "swap",
});

const BENEFITS = [
  { cls: "b1", k: "Low-latency voice", v: "Natural follow-ups", icon: <MicIcon /> },
  { cls: "b2", k: "Actionable feedback", v: "Approach + Big-O", icon: <TrendIcon /> },
  { cls: "b3", k: "Progress tracking", v: "Sessions & trends", icon: <ClockIcon /> },
];

const LANE_ONE = [
  { t: "Arrays & Strings", c: "c1" },
  { t: "Linked Lists", c: "c2" },
  { t: "Stacks & Queues", c: "c3" },
  { t: "Binary Trees & BSTs", c: "c4" },
  { t: "Graphs & Traversals", c: "c1" },
];

const LANE_TWO = [
  { t: "Dynamic Programming", c: "c3" },
  { t: "Greedy Algorithms", c: "c2" },
  { t: "Sliding Window", c: "c4" },
  { t: "Recursion & Backtracking", c: "c1" },
  { t: "Hashing", c: "c2" },
];

function Lane({ items, reverse }: { items: { t: string; c: string }[]; reverse?: boolean }) {
  return (
    <div className={`lane${reverse ? " rev" : ""}`}>
      <div className="track">
        {items.map((i) => (
          <span key={i.t} className={`topic ${i.c}`}>{i.t}</span>
        ))}
        {items.map((i) => (
          <span key={`${i.t}-dup`} className={`topic ${i.c}`} aria-hidden="true">{i.t}</span>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className={`mqh ${bricolage.variable} ${figtree.variable}`}>
      <ScrollReveal />
      <AppHeader />

      <div>
        <section className="hero">
          <div className="wrap">
            <div>
              <p className="tag"><i aria-hidden="true"></i>Your 24/7 AI Coding Interviewer</p>
              <h1>
                <span><em><b>Practice DSA Interviews</b></em></span>
                <span><em>like the</em></span>
                <span><em>real thing</em></span>
              </h1>
              <p className="lede">Get grilled by an AI interviewer, think aloud, code in the browser, and receive instant feedback on approach, correctness, and complexity — so you walk into real interviews with confidence.</p>
              <div className="cta-row">
                <Link href="/start-interview" className="btn">Start Free Mock Interview<Arrow /></Link>
              </div>
            </div>

            <div className="stage" aria-hidden="true">
              <svg className="orbit" viewBox="0 0 800 800">
                <path d="M120 30 C 420 -40 780 120 790 420" stroke="#F2A33A" />
                <path d="M60 330 C 160 640 520 760 790 560" stroke="#E5503A" />
              </svg>
              <div className="glow"></div>
              <HeroCube />
              <div className="ready">
                <small>Ready when you are</small>
                <p className="q">Pick a topic, a level and a length. Your interviewer takes it from there.</p>
                <div className="foot"><span className="chip">DSA</span><span className="chip">Easy · Medium · Hard</span><span className="chip">15–45 min</span></div>
              </div>
              <div className="badge"><strong>Voice + code</strong>in one session</div>
            </div>
          </div>
        </section>

        <div className="wrap benefits-wrap">
          <div className="benefits">
            {BENEFITS.map((b) => (
              <div className={`benefit ${b.cls}`} key={b.k}>
                <span className="bi">{b.icon}</span>
                <small>{b.k}</small>
                <strong>{b.v}</strong>
              </div>
            ))}
          </div>
        </div>

        <section className="how sec">
          <div className="wrap">
            <div className="sec-head reveal">
              <h2>How it <b>works</b></h2>
              <p className="lede" style={{ marginInline: "auto", marginTop: 18 }}>Three moves, one session.</p>
            </div>
            <div className="route">
              <svg className="route-line" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 60 C 160 -10, 300 -10, 400 60 S 640 130, 760 60 S 940 10, 1000 50" />
              </svg>
              <article className="stop s1">
                <div className="big">1</div>
                <h3>Pick your focus</h3>
                <p>Choose topics, difficulty, and target companies.</p>
                <div className="mini"><span className="on">Graphs</span><span>Medium</span><span>30 min</span></div>
              </article>
              <article className="stop s2">
                <div className="big">2</div>
                <h3>Speak &amp; solve</h3>
                <p>Clarify requirements, discuss trade-offs, and code in the browser.</p>
                <div className="mini code">
                  <div>
                    <b>def</b> two_sum(nums, target):<br />
                    &nbsp;&nbsp;seen = {"{}"}<br />
                    &nbsp;&nbsp;<b>for</b> i, n <b>in</b> enumerate(nums):
                  </div>
                </div>
              </article>
              <article className="stop s3">
                <div className="big">3</div>
                <h3>Get coached</h3>
                <p>Immediate feedback on approach, complexity, and clarity — plus next steps.</p>
                <div className="mini score">
                  <span className="ring"><i>82%</i></span>
                  <p>Preparation score<br />after every session</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="built sec">
          <div className="wrap">
            <div className="sec-head reveal"><h2>Built for <b>DSA success</b></h2></div>
            <div className="bento">
              <article className="tile t-voice">
                <h3>Voice-enabled mock interviews (think aloud)</h3>
                <div className="eq" aria-hidden="true">
                  {Array.from({ length: 16 }, (_, i) => <i key={i}></i>)}
                </div>
              </article>
              <article className="tile t-company">
                <h3>Company-aware DSA questions by topic &amp; level</h3>
                <div className="lvl art" aria-hidden="true"><span>Easy</span><span className="on">Medium</span><span>Hard</span></div>
              </article>
              <article className="tile t-bigo">
                <h3>Follow-ups on time &amp; space complexity (Big-O clarity)</h3>
                <div className="bigo art" aria-hidden="true"><s>O(n²)</s><span>→</span><b>O(n)</b></div>
              </article>
              <article className="tile t-flow">
                <h3>Structured problem discussion (requirements → edges → tests)</h3>
                <div className="flow art" aria-hidden="true">
                  <span>Requirements</span>
                  <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  <span>Edge cases</span>
                  <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  <span>Tests</span>
                </div>
              </article>
              <article className="tile t-hint">
                <h3>Hint-first guidance (learn, don’t memorize answers)</h3>
                <div className="bubble art" aria-hidden="true"><small>Hint 1 of 3</small>What if you stored values you have already seen?</div>
              </article>
              <article className="tile t-pressure">
                <h3>Real interview pressure — with constructive coaching</h3>
                <div className="timer art" aria-hidden="true">24:10<small>left in your session</small></div>
              </article>
            </div>
          </div>
        </section>

        <section className="topics">
          <div className="topics-in">
            <h2 className="reveal">Topics we <b>cover</b></h2>
            <p className="lede">Ten core DSA areas, from arrays to dynamic programming.</p>
            <Lane items={LANE_ONE} />
            <Lane items={LANE_TWO} reverse />
            <div className="cta"><Link href="/start-interview" className="btn">Pick a topic and start<Arrow /></Link></div>
          </div>
        </section>

        <section className="final">
          <div className="final-in">
            <h2>Ready for your <b>first mock round?</b></h2>
            <p>Speak, code and get scored in one session. Your first interviews are free.</p>
            <Link href="/start-interview" className="btn">Start Free Mock Interview<Arrow /></Link>
            <span className="note">
              Testimonials coming soon — join early and help shape MockQube.{" "}
              <Link href="/pricing" style={{ textDecoration: "underline", fontWeight: 600 }}>See Plans</Link>
            </span>
          </div>
        </section>
      </div>

      <HomeFooter />
    </div>
  );
}
