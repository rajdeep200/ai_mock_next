'use client'

import Link from 'next/link'
import { FiArrowRight, FiCpu, FiMic, FiTrendingUp, FiClock, FiMessageSquare, FiShield } from 'react-icons/fi'

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* === Background layers (grid + glow orbs + scanlines) === */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Neon grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,.08),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(34,197,94,.06),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(59,130,246,.05),transparent_45%)]" />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]">
          <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.6)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>
        {/* Soft vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,.7))]" />
        {/* Scanlines */}
        <div className="absolute inset-0 opacity-[.12] mix-blend-soft-light bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,.06)_3px,rgba(255,255,255,.06)_3px)] animate-scan" />
      </div>

      {/* === Hero === */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-15 pb-10 text-center sm:pt-32">
        <div className="mx-auto max-w-5xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-ping-slow rounded-full bg-green-400" />
            Next-gen interview prep
          </span>

          <h1 className="mt-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-5xl font-extrabold leading-[1.1] text-transparent sm:text-6xl md:text-7xl">
            AI-Powered Mock Interviews
            <br />
            <span className="text-green-400 drop-shadow-[0_0_30px_rgba(34,197,94,.35)]">
              Personalized for You
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 sm:text-xl">
            Practice with an intelligent AI interviewer that adapts to your role, experience, and target company.
            Sharpen your communication and problem-solving with real-time voice + chat.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/home" className="group">
              <button className="cursor-pointer relative inline-flex items-center gap-2 rounded-full bg-green-600 px-7 py-3 text-lg font-semibold text-white transition-all hover:bg-green-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">
                <span className="absolute inset-0 -z-10 rounded-full bg-green-500/30 blur-lg transition-opacity group-hover:opacity-100" />
                Get Started Free
                <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </Link>
            <Link href="/pricing">
              <button className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-gray-700/80 bg-gray-900/60 px-7 py-3 text-lg text-gray-200 backdrop-blur transition-all hover:border-green-700/70 hover:bg-gray-900">
                View Pricing
              </button>
            </Link>
          </div>
        </div>

        {/* Floating stat cards */}
        <div className="mt-14 grid w-full max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { k: 'Avg. Improvement', v: '72%', icon: <FiTrendingUp /> },
            { k: 'Voice Latency', v: '~200ms', icon: <FiMic /> },
            { k: 'Sessions Run', v: '25k+', icon: <FiClock /> },
          ].map((s, i) => (
            <div
              key={i}
              className="animate-float rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/60 to-black/60 p-4 backdrop-blur transition hover:border-green-700/60"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="mb-1 flex items-center gap-2 text-sm text-gray-400">
                <span className="text-green-400">{s.icon}</span>
                {s.k}
              </div>
              <div className="text-2xl font-bold text-white">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* === Features (glass cards) === */}
      <section className="relative z-10 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Built for <span className="text-green-400">serious prep</span>
            </h2>
            <p className="mt-3 text-gray-300">
              A clean, focused workspace with futuristic UI that stays out of your way while you get better.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Realistic Simulation',
                desc: 'Behavioral + technical prompts that mirror top-tier interviews.',
                icon: <FiMessageSquare />,
              },
              {
                title: 'Adaptive AI',
                desc: 'Questions scale with your level, stack, and target company.',
                icon: <FiCpu />,
              },
              {
                title: 'Instant Voice',
                desc: 'Speak naturally and get low-latency voice responses.',
                icon: <FiMic />,
              },
              {
                title: 'Actionable Feedback',
                desc: 'Tight, immediate critique after each response.',
                icon: <FiTrendingUp />,
              },
              {
                title: 'Progress History',
                desc: 'Every session logged so you can track growth.',
                icon: <FiClock />,
              },
              {
                title: 'Private by Design',
                desc: 'Traffic is encrypted; your practice stays yours.',
                icon: <FiShield />,
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur transition-all hover:border-green-700/70 hover:shadow-[0_0_40px_rgba(34,197,94,.15)]"
              >
                {/* corner glow */}
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-green-500/20 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-black text-green-400">
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold text-green-300">{f.title}</h3>
                <p className="mt-2 text-gray-300">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === Testimonials (glass rail) === */}
      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-3xl font-bold sm:text-4xl">
            Loved by <span className="text-green-400">candidates</span>
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              {
                name: 'Rahul S.',
                review:
                  'MockQube felt like a real interview loop. I built confidence and cracked my Meta interview.',
              },
              {
                name: 'Ananya P.',
                review:
                  'Feedback is precise and the questions actually matched my target teams.',
              },
              {
                name: 'Mohit R.',
                review:
                  'Did not expect an AI to push me this well. The voice flow is crazy good.',
              },
              {
                name: 'Sneha K.',
                review:
                  'Perfect for late-night reps. Tight prompts, fast coaching, great UI.',
              },
            ].map((t, i) => (
              <figure
                key={i}
                className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/60 to-black/60 p-6 text-left backdrop-blur"
              >
                <blockquote className="italic text-gray-300">“{t.review}”</blockquote>
                <figcaption className="mt-4 font-semibold text-green-400">— {t.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA === */}
      <section className="relative z-10 px-6 pb-24">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-green-700/40 bg-gradient-to-br from-green-700/30 via-green-700/10 to-black p-8 text-center shadow-[0_0_60px_rgba(34,197,94,.18)] sm:p-12">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to <span className="text-green-400">ace</span> your next interview?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-100/90">
            Join thousands of developers leveling up with MockQube. It’s fast, focused, and built for real outcomes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link href="/home" className="group">
              <button className="relative inline-flex items-center gap-2 rounded-full bg-black px-8 py-4 text-lg font-bold text-white transition-all hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">
                <span className="cursor-pointer absolute inset-0 -z-10 rounded-full bg-green-500/25 blur-xl transition-opacity group-hover:opacity-100" />
                Start Practicing Now
                <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </Link>
            <Link href="/pricing">
              <button className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-green-700/50 bg-green-500/10 px-8 py-4 text-lg font-semibold text-green-200 backdrop-blur hover:border-green-500/70">
                See Plans
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Local styles for subtle animation */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 12s linear infinite;
          background-size: auto 6px;
        }
        .animate-ping-slow {
          animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </main>
  )
}
