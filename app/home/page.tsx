'use client'

import Link from 'next/link'

export default function HomePage() {
    return (
        <main className="text-white bg-black min-h-screen flex flex-col items-center px-4">
            {/* Hero Section */}
            <section className="w-full max-w-5xl py-20 text-center">
                <h1 className="text-4xl sm:text-6xl font-bold mb-4 leading-tight">
                    Crack DSA Interviews with <span className="text-green-500">Confidence</span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-300 mb-8">
                    Real-time mock interviews powered by AI. Practice solving real coding problems like it's the real thing.
                </p>
                <Link
                    href="/start-interview"
                    className="bg-green-600 hover:bg-green-700 text-white text-lg font-semibold py-3 px-6 rounded-full transition"
                >
                    Start DSA Mock Interview
                </Link>
            </section>

            {/* How It Works */}
            <section className="w-full max-w-4xl py-12">
                <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-center text-green-400">
                    How It Works
                </h2>
                <div className="grid sm:grid-cols-3 gap-6 text-center">
                    {[
                        { title: 'Select Duration', desc: 'Pick how long your mock interview should last.' },
                        { title: 'Get Real DSA Problems', desc: 'AI asks real-world ambiguous DSA problems—like a real interviewer.' },
                        { title: 'Receive Feedback', desc: 'Get performance summary and hints to improve.' },
                    ].map((step, idx) => (
                        <div key={idx} className="bg-gray-900 p-6 rounded-xl border border-green-700">
                            <h3 className="text-xl font-semibold text-green-400 mb-2">{step.title}</h3>
                            <p className="text-gray-300 text-sm">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="w-full max-w-5xl py-16">
                <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-center text-green-400">
                    Built for DSA Interview Success
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {[
                        'Voice-enabled mock interviews',
                        'Company-specific DSA questions',
                        'Step-by-step problem discussion',
                        'Hint-only guidance (no full answers)',
                        'Follow-up questions on time & space complexity',
                        'Simulates ambiguity & pressure of real interviews',
                    ].map((feature, idx) => (
                        <div key={idx} className="bg-gray-800 p-5 rounded-lg border border-green-700">
                            <p className="text-white">✅ {feature}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* DSA Topics */}
            <section className="w-full max-w-4xl py-12">
                <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-center text-green-400">
                    Topics We Cover
                </h2>
                <div className="flex flex-wrap justify-center gap-4">
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
                        <div
                            key={idx}
                            className="bg-green-700 px-4 py-2 rounded-full text-sm sm:text-base text-white"
                        >
                            {topic}
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonials Placeholder */}
            <section className="w-full max-w-4xl py-12 text-center border-t border-green-800">
                <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-green-400">
                    What Our Users Say
                </h2>
                <p className="text-green-300 italic">🚧 Testimonials coming soon...</p>
            </section>

            {/* Footer */}
            <footer className="w-full py-6 mt-12 border-t border-green-800 text-center text-sm text-green-400">
                © {new Date().getFullYear()} MockInterviewer.AI · Built for DSA Legends 🧠
            </footer>
        </main>
    )
}
