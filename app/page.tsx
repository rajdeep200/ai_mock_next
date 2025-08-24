'use client'

import Link from 'next/link'
import { FiArrowRight } from 'react-icons/fi'

export default function LandingPage() {
  return (
    <main className="bg-gradient-to-b from-black via-gray-900 to-black text-white min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl">
          AI-Powered Mock Interviews <br />
          <span className="text-green-400">Personalized for You</span>
        </h1>
        <p className="text-lg sm:text-xl mt-6 max-w-2xl text-gray-300">
          Practice with an intelligent AI interviewer that adapts to your role, experience, and company targets. Sharpen your skills and land your dream job.
        </p>
        <div className="mt-8">
          <Link href="/home">
            <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-full text-lg flex items-center gap-2">
              Get Started Free <FiArrowRight />
            </button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {[
            {
              title: 'Realistic Interview Simulation',
              desc: 'Get questioned by an AI that mimics real-world interviewers across tech domains.',
            },
            {
              title: 'Tailored to Your Role & Experience',
              desc: 'Choose your role, level, and companies to get the most relevant questions.',
            },
            {
              title: 'Instant Voice + Chat Interaction',
              desc: 'Speak naturally, get voice replies, and train your communication skills in real time.',
            },
            {
              title: 'Feedback After Each Response',
              desc: 'Receive AI-generated feedback so you know exactly what to improve.',
            },
            {
              title: 'Track Progress & History',
              desc: 'Keep a log of all past interviews and monitor how you improve over time.',
            },
            {
              title: 'No More Scheduling Hassles',
              desc: 'Practice anytime, anywhere. No human interviewer required.',
            },
          ].map((f, i) => (
            <div key={i} className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition border border-green-700">
              <h3 className="text-xl font-semibold mb-2 text-green-400">{f.title}</h3>
              <p className="text-gray-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-black text-white text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-green-400">What Candidates Are Saying</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
          {[
            {
              name: 'Rahul S.',
              review:
                'MockQube helped me get comfortable with real interview pressure. I cracked my Meta interview!',
            },
            {
              name: 'Ananya P.',
              review:
                'The feedback is on point and the questions are tailored exactly to the roles I was applying for.',
            },
            {
              name: 'Mohit R.',
              review:
                'I never thought practicing with an AI could feel so real. Best interview prep tool out there!',
            },
            {
              name: 'Sneha K.',
              review:
                'Perfect for busy professionals. I practiced late at night and still felt fully challenged.',
            },
          ].map((t, i) => (
            <div key={i} className="bg-gray-800 p-6 rounded-xl shadow-md text-left border border-green-800">
              <p className="italic text-gray-300">“{t.review}”</p>
              <p className="mt-4 font-semibold text-green-400">— {t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-green-700 text-white text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Ace Your Next Interview?</h2>
        <p className="text-lg max-w-xl mx-auto mb-6">
          Join thousands of developers using MockQube to prepare smarter and get hired faster.
        </p>
        <Link href="/home">
          <button className="bg-black hover:bg-gray-900 text-white font-bold px-8 py-4 rounded-full text-lg">
            Start Practicing Now
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-green-800 py-6 text-center text-sm text-green-400">
        © {new Date().getFullYear()} MockQube · All rights reserved
      </footer>
    </main>
  )
}
