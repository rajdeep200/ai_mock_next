import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./home.css";
import HomeHeader from "@/component/home/HomeHeader";
import HomeFooter from "@/component/home/HomeFooter";
import StartCard from "@/component/home/StartCard";
import ScrollReveal from "@/component/home/ScrollReveal";
import Plans from "@/component/home/Plans";
import {
  Arrow,
  MicIcon,
  TrendIcon,
  ClockIcon,
  ChatIcon,
  ChipIcon,
  ShieldIcon,
  PulseIcon,
  CodeIcon,
} from "@/component/home/icons";

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
  { k: "Low-latency voice", v: "Natural follow-ups", icon: <MicIcon /> },
  { k: "Actionable feedback", v: "Approach + Big-O", icon: <TrendIcon /> },
  { k: "Progress tracking", v: "Sessions & trends", icon: <ClockIcon /> },
];

const FEATURES = [
  { title: "Interviewer-style prompts", desc: "Ambiguous statements with clarifying follow-ups — just like onsite.", icon: <ChatIcon /> },
  { title: "Adaptive difficulty", desc: "Questions scale by topic, level, and target companies.", icon: <ChipIcon /> },
  { title: "Low-latency voice", desc: "Speak your approach and get immediate hints or nudges.", icon: <MicIcon /> },
  { title: "Actionable scoring", desc: "Signal, reasoning, edge cases, and communication — graded each session.", icon: <TrendIcon /> },
  { title: "Progress you can track", desc: "History, trends, and summaries to target weak areas.", icon: <ClockIcon /> },
  { title: "Privacy-first", desc: "Encrypted transport and mindful data handling — your practice stays yours.", icon: <ShieldIcon /> },
];

const SESSION_PARTS = [
  { title: "You speak", desc: "Answer out loud. Your browser transcribes it, and a pause of a second and a half sends your answer.", icon: <MicIcon /> },
  { title: "The interviewer replies", desc: "It asks follow-ups, nudges you at five, two and one minute left, and checks in if the room goes quiet.", icon: <PulseIcon /> },
  { title: "You code", desc: "When the interview moves to the practical, the editor opens beside the conversation.", icon: <CodeIcon /> },
];

const SKILLS = [
  { name: "Problem solving", score: 88 },
  { name: "Communication", score: 76 },
  { name: "Code quality", score: 81 },
  { name: "Complexity", score: 70 },
];

const FAQS = [
  { q: "What is MockQube?", a: "A mock interview you do by voice. An AI interviewer asks questions, reacts to your answers and can move you into a coding exercise." },
  { q: "Which topics can I practice?", a: "MockQube focuses on data structures and algorithms (DSA) interviews, including company-style rounds. On Starter and Pro you can also pick a single topic, such as Binary search, Sorting, BFS or DFS, and the whole interview is built around it." },
  { q: "Do I need a microphone?", a: "The voice flow uses your browser's speech recognition, so a microphone and a supported browser work best. You can also write your answers in the editor." },
  { q: "How long can a session be?", a: "Free sessions run up to 15 minutes, Starter up to 30, and Pro up to 45." },
  { q: "Can I share my results?", a: "Yes. Any completed session can be turned into a public link with a preview image." },
];

export default function LandingPage() {
  return (
    <div className={`mq ${bricolage.variable} ${figtree.variable}`}>
      <ScrollReveal />
      <HomeHeader />

      <div>
        <section className="hero">
          <div className="wrap">
            <div>
              <p className="tag"><i aria-hidden="true"></i>Your 24/7 AI Coding Interviewer</p>
              <h1>
                <span><em><b>Mock Interviews</b></em></span>
                <span><em>that feel like</em></span>
                <span><em>the real thing</em></span>
              </h1>
              <p className="lede">Practice DSA and company-style rounds with an adaptive AI interviewer. Think aloud, code in the browser, get instant follow-ups, and leave each session with clear next steps.</p>
              <div className="cta-row">
                <Link href="/dashboard" className="btn">Start Free Mock<Arrow /></Link>
                <a href="#plans" className="btn ghost">See Plans</a>
              </div>
            </div>

            <div className="stage" aria-hidden="true">
              <svg className="orbit" viewBox="0 0 800 800">
                <path d="M120 30 C 420 -40 780 120 790 420" stroke="#F2A33A" />
                <path d="M60 330 C 160 640 520 760 790 560" stroke="#E5503A" />
              </svg>
              <div className="disc"></div>
              <div className="session">
                <div className="row"><span className="live">Live</span><span>24:10 left</span></div>
                <p className="q">Your solution is O(n²). Can you get the lookup down to constant time?</p>
                <div className="wave">
                  {Array.from({ length: 18 }, (_, i) => <i key={i}></i>)}
                </div>
                <div className="foot"><span className="chip">DSA</span><span className="chip">Medium</span><span className="chip">30 min</span></div>
              </div>
              <div className="badge"><strong>82%</strong>prepared after the<br />last session</div>
            </div>
          </div>

          <div className="wrap benefits-wrap">
            <div className="benefits">
              {BENEFITS.map((b) => (
                <div className="benefit" key={b.k}>
                  <span className="bi">{b.icon}</span>
                  <small>{b.k}</small>
                  <strong>{b.v}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <StartCard />

        <section className="sec" id="features">
          <div className="wrap">
            <div className="sec-head reveal">
              <h2>Everything you need to <b>perform under pressure</b></h2>
              <p className="lede">Compress weeks of prep into focused, measurable reps — without scheduling hassles or peer coordination.</p>
            </div>
            <div className="feats">
              {FEATURES.map((f) => (
                <article className="feat" key={f.title}>
                  <div className="ic">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="parts sec">
          <div className="wrap">
            <h2 className="reveal">What happens <b>inside a session</b></h2>
            <div className="cards">
              {SESSION_PARTS.map((p) => (
                <article className="card" key={p.title}>
                  <div className="ic">{p.icon}</div>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="steps sec" id="how">
          <div className="wrap">
            <div className="sec-head reveal">
              <h2>Three steps from <b>nervous</b> to ready</h2>
              <p className="lede">Set it up in under a minute. The rest is a conversation.</p>
            </div>
            <div className="arches">
              <div className="arch a1">
                <div className="pill-step">Step <span>1</span></div>
                <p className="nm">Choose your challenge</p>
                <h3>Pick your next coding challenge.</h3>
                <p>Choose a DSA topic, difficulty level, and session length that match your preparation goals.</p>
                <svg className="art" viewBox="0 0 200 90" fill="none" aria-hidden="true">
                  <rect x="20" y="40" width="160" height="50" rx="14" fill="#fff" fillOpacity=".16" />
                  <rect x="36" y="56" width="70" height="8" rx="4" fill="#fff" fillOpacity=".7" />
                  <rect x="36" y="72" width="110" height="8" rx="4" fill="#fff" fillOpacity=".35" />
                </svg>
              </div>
              <div className="arch a2">
                <div className="pill-step">Step <span>2</span></div>
                <p className="nm">Solve it like a real interview</p>
                <h3>Think aloud. Code. Solve.</h3>
                <p>Work through the problem in your coding session and explain your approach just like you would in a real technical interview.</p>
                <svg className="art" viewBox="0 0 200 90" fill="none" aria-hidden="true">
                  <g fill="#FFB43A">
                    <rect x="30" y="38" width="8" height="52" rx="4" /><rect x="48" y="26" width="8" height="64" rx="4" />
                    <rect x="66" y="46" width="8" height="44" rx="4" /><rect x="84" y="18" width="8" height="72" rx="4" />
                    <rect x="102" y="34" width="8" height="56" rx="4" /><rect x="120" y="48" width="8" height="42" rx="4" />
                    <rect x="138" y="28" width="8" height="62" rx="4" /><rect x="156" y="42" width="8" height="48" rx="4" />
                  </g>
                </svg>
              </div>
              <div className="arch a3">
                <div className="pill-step">Step <span>3</span></div>
                <p className="nm">Know where you stand</p>
                <h3>Get feedback. Level up.</h3>
                <p>Review your performance report and preparation score to understand your strengths and identify what to improve next.</p>
                <svg className="art" viewBox="0 0 200 90" fill="none" aria-hidden="true">
                  <circle cx="100" cy="90" r="64" stroke="#fff" strokeOpacity=".35" strokeWidth="10" />
                  <path d="M36 90a64 64 0 0 1 112-42" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 56 }}>
              <a href="#start" className="btn">Start a session <Arrow /></a>
            </div>
          </div>
        </section>

        <Plans />

        <section className="report">
          <div className="report-in" id="reportBlock">
            <div>
              <h2>A score you <b>can act on</b></h2>
              <p className="lede">Every session ends with written feedback on what went well, what to fix, and a preparation percentage you can compare from one attempt to the next.</p>
              <a href="#start" className="btn">Try a session <Arrow /></a>
            </div>
            <div className="sheet" role="img" aria-label="Sample feedback report: 82 percent prepared. Problem solving 88, communication 76, code quality 81, complexity analysis 70.">
              <div className="top">
                <div className="meter"><div>82%</div></div>
                <div><h3>Sample report: two-pointer problem</h3><small>Preparation percentage</small></div>
              </div>
              <div className="skills" aria-hidden="true">
                {SKILLS.map((s) => (
                  <div className="skill" key={s.name}>
                    <span>{s.name}</span>
                    <div className="track"><i style={{ "--w": `${s.score}%` } as React.CSSProperties}></i></div>
                    <span>{s.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="quotes sec">
          <div className="wrap">
            <div className="sec-head reveal"><h2>Trusted by <b>early adopters</b></h2></div>
            <div className="quote-grid">
              <figure className="quote"><blockquote>“Feedback from our private beta users is coming soon. Stay tuned!”</blockquote><figcaption>— Early Access Program</figcaption></figure>
              <figure className="quote"><blockquote>“Join our waitlist to shape the product and get early perks.”</blockquote><figcaption>— MockQube Team</figcaption></figure>
            </div>
            <p className="quote-note">Want to be one of the first to leave a testimonial? <Link href="/dashboard">Join the beta</Link></p>
          </div>
        </section>

        <section className="faq sec" id="faq">
          <div className="wrap">
            <div className="sec-head reveal"><h2>Questions <b>people ask</b></h2></div>
            {FAQS.map((f) => (
              <details className="q" key={f.q}>
                <summary>{f.q}<i aria-hidden="true"></i></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="final">
          <div className="final-in">
            <h2>Turn practice into <b>offers</b></h2>
            <p>Do focused reps that mirror top-tier interviews. Speak, get feedback, repeat — until it’s muscle memory.</p>
            <div className="btns">
              <a href="#plans" className="btn ghost">See Plans</a>
              <Link href="/dashboard" className="btn">Start Practicing Now<Arrow /></Link>
            </div>
          </div>
        </section>
      </div>

      <HomeFooter />
    </div>
  );
}
