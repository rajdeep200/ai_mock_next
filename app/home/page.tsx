'use client'

import Link from 'next/link'
import { FiClock, FiCpu, FiMic, FiTrendingUp, FiArrowRight } from 'react-icons/fi'

export default function HomePage() {
    return (
        <main className="relative min-h-screen overflow-hidden bg-black text-white">
            {/* === Background layers (grid + glow orbs + scanlines) === */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
                {/* Neon blobs */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,.08),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(34,197,94,.06),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(59,130,246,.05),transparent_45%)]" />
                {/* Grid */}
                <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]">
                    <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.55)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.55)_1px,transparent_1px)] bg-[size:48px_48px]" />
                </div>
                {/* Vignette + scanlines */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,.7))]" />
                <div className="absolute inset-0 opacity-[.12] mix-blend-soft-light bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,.06)_3px,rgba(255,255,255,.06)_3px)] animate-scan" />
            </div>

            {/* === Hero === */}
            <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-24 pb-14 text-center sm:pt-28">
                <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300 backdrop-blur">
                    <span className="h-1.5 w-1.5 animate-ping-slow rounded-full bg-green-400" />
                    Your 24/7 AI Coding Interviewer
                </span>

                <h1 className="mt-5 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-4xl font-extrabold leading-[1.1] text-transparent sm:text-6xl md:text-7xl">
                    Practice DSA Interviews{' '}
                    <span className="text-green-400 drop-shadow-[0_0_30px_rgba(34,197,94,.35)]">like the real thing</span>
                </h1>

                <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-300 sm:text-xl">
                    Get grilled by an AI interviewer, think aloud, code in the browser, and receive instant feedback on approach,
                    correctness, and complexity—so you walk into real interviews with confidence.
                </p>

                <div className="mt-9">
                    <Link href="/start-interview" className="group">
                        <button className="relative inline-flex items-center gap-2 rounded-full bg-green-600 px-7 py-3 text-lg font-semibold text-white transition-all hover:bg-green-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">
                            <span className="absolute inset-0 -z-10 rounded-full bg-green-500/30 blur-lg transition-opacity group-hover:opacity-100" />
                            Start Free Mock Interview
                            <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
                        </button>
                    </Link>
                </div>

                {/* Floating mini-stats — credibility-safe benefits instead of vanity numbers */}
                <div className="mt-12 grid w-full max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3">
                    {[
                        { k: 'Low-latency voice', v: 'Natural follow-ups', icon: <FiMic /> },
                        { k: 'Actionable feedback', v: 'Approach + Big-O', icon: <FiTrendingUp /> },
                        { k: 'Progress tracking', v: 'Sessions & trends', icon: <FiClock /> },
                    ].map((s, i) => (
                        <div
                            key={i}
                            className={`animate-float rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/60 to-black/60 p-4 backdrop-blur transition hover:border-green-700/60
        ${i === 2 ? 'col-span-2 justify-self-center sm:col-span-1 sm:justify-self-auto w-full max-w-[22rem]' : ''}`}
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

            {/* === How It Works === */}
            <section className="relative z-10 w-full px-6 py-12">
                <div className="mx-auto max-w-5xl">
                    <h2 className="mb-8 text-center text-3xl font-bold sm:text-4xl">
                        How it <span className="text-green-400">works</span>
                    </h2>

                    <div className="grid gap-6 text-center sm:grid-cols-3">
                        {[
                            { title: 'Pick your focus', desc: 'Choose topics, difficulty, and target companies.' },
                            { title: 'Speak & solve', desc: 'Clarify requirements, discuss trade-offs, and code in the browser.' },
                            { title: 'Get coached', desc: 'Immediate feedback on approach, complexity, and clarity—plus next steps.' },
                        ].map((step, idx) => (
                            <div
                                key={idx}
                                className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur transition-all hover:border-green-700/70 hover:shadow-[0_0_36px_rgba(34,197,94,.15)]"
                            >
                                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-green-500/20 blur-2xl transition-opacity group-hover:opacity-100" />
                                <h3 className="text-xl font-semibold text-green-300">{step.title}</h3>
                                <p className="mt-2 text-gray-300 text-sm">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === Features === */}
            <section className="relative z-10 w-full px-6 py-16">
                <div className="mx-auto max-w-6xl">
                    <h2 className="mb-8 text-center text-3xl font-bold sm:text-4xl">
                        Built for <span className="text-green-400">DSA success</span>
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2">
                        {[
                            { t: 'Voice-enabled mock interviews (think aloud)', i: <FiMic /> },
                            { t: 'Company-aware DSA questions by topic & level', i: <FiCpu /> },
                            { t: 'Structured problem discussion (requirements → edges → tests)', i: <FiTrendingUp /> },
                            { t: 'Hint-first guidance (learn, don’t memorize answers)', i: <FiArrowRight /> },
                            { t: 'Follow-ups on time & space complexity (Big-O clarity)', i: <FiClock /> },
                            { t: 'Real interview pressure — with constructive coaching', i: <FiTrendingUp /> },
                        ].map((f, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-gray-900/60 p-5 backdrop-blur hover:border-green-700/70"
                            >
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-black text-green-400">
                                    {f.i}
                                </div>
                                <p className="text-gray-100">{f.t}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === Topics === */}
            <section className="relative z-10 w-full px-6 py-12">
                <div className="mx-auto max-w-5xl">
                    <h2 className="mb-6 text-center text-3xl font-bold sm:text-4xl">
                        Topics we <span className="text-green-400">cover</span>
                    </h2>

                    <div className="flex flex-wrap justify-center gap-3">
                        {[
                            'Arrays & Strings',
                            'Linked Lists',
                            'Stacks & Queues',
                            'Binary Trees & BSTs',
                            'Graphs & Traversals',
                            'Dynamic Programming',
                            'Greedy Algorithms',
                            'Sliding Window',
                            'Recursion & Backtracking',
                            'Hashing',
                        ].map((topic, idx) => (
                            <span
                                key={idx}
                                className="rounded-full border border-green-700/60 bg-green-600/20 px-4 py-2 text-sm text-green-100 backdrop-blur hover:border-green-500/80"
                            >
                                {topic}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* === Social proof placeholder === */}
            <section className="relative z-10 w-full border-t border-green-800/40 px-6 py-16 text-center">
                <div className="mx-auto max-w-4xl">
                    <h2 className="mb-6 text-3xl font-bold text-green-400 sm:text-4xl">What our users say</h2>
                    <p className="italic text-green-300/90">
                        🚧 Testimonials coming soon — join early and help shape MockQube.
                    </p>
                    <div className="mt-6">
                        <Link href="/pricing" className="group inline-flex items-center gap-2 text-green-300 hover:text-green-200">
                            See Plans <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Local animations */}
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
