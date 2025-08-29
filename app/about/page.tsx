// app/about/page.tsx
export const metadata = {
    title: "About | MockQube",
    description:
        "Learn how MockQube uses AI to deliver realistic DSA mock interviews with actionable feedback.",
};

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-black text-white">
            <section className="mx-auto max-w-5xl px-4 sm:px-8 py-12">
                <h1 className="text-3xl sm:text-4xl font-bold text-green-400 mb-4">
                    About MockQube
                </h1>
                <p className="text-gray-300 leading-7">
                    MockQube is an AI-powered platform for practicing{" "}
                    <span className="text-green-300 font-medium">DSA interviews</span>
                    . It simulates a realistic interview environment—asking clarifying
                    questions, evaluating your code and reasoning, and producing a concise
                    summary with actionable feedback at the end of each session.
                </p>

                <div className="grid md:grid-cols-3 gap-6 mt-10">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <h2 className="text-lg font-semibold text-green-300 mb-2">
                            Realistic Flow
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Interviews start with a brief intro, then jump into ambiguous
                            prompts that require clarifications—just like real life.
                        </p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <h2 className="text-lg font-semibold text-green-300 mb-2">
                            Code + Voice
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Talk through your approach and submit code. Get quick, focused
                            feedback on correctness, complexity, and edge cases.
                        </p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <h2 className="text-lg font-semibold text-green-300 mb-2">
                            Actionable Summary
                        </h2>
                        <p className="text-gray-400 text-sm">
                            End-of-interview summaries highlight strengths, gaps, and a
                            practice plan—so you know exactly what to do next.
                        </p>
                    </div>
                </div>

                <div className="mt-10">
                    <h3 className="text-xl font-semibold text-green-400 mb-3">Our Goal</h3>
                    <p className="text-gray-300 leading-7">
                        We want to help candidates build confidence under realistic
                        constraints: clarify requirements, reason out trade-offs, and write
                        clean code. MockQube makes that practice loop fast, focused, and
                        repeatable.
                    </p>
                </div>
            </section>
        </main>
    );
}
