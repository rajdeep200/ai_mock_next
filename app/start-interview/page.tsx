'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FiSettings,
  FiBriefcase,
  FiTrendingUp,
  FiClock,
  FiArrowLeft,
} from 'react-icons/fi'
import { useAuth } from '@clerk/nextjs'

export default function StartInterviewPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    technology: 'dsa',
    company: '',
    level: '',
    duration: 30,
  })
  const [planInfo, setPlanInfo] = useState<null | {
    plan: {
      id: 'free' | 'starter' | 'pro'
      monthlyInterviewCap: number
      maxMinutesPerInterview: number
      label: string
    }
    usage: { interviewsCount: number; month: string }
  }>(null)

  const router = useRouter()
  const { getToken } = useAuth()

  useEffect(() => {
    ; (async () => {
      const res = await fetch('/api/plan')
      if (res.ok) setPlanInfo(await res.json())
    })()
  }, [])

  const capReached = planInfo
    ? planInfo.usage.interviewsCount >= planInfo.plan.monthlyInterviewCap
    : false
  const tooLong = planInfo
    ? formData.duration > planInfo.plan.maxMinutesPerInterview
    : false

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const token = await getToken()

    const res = await fetch('/api/create-interview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        technology: formData.technology,
        company: formData.company,
        level: formData.level,
        duration: formData.duration,
      }),
    })

    if (!res.ok) {
      console.error('Failed to create session')
      setLoading(false)
      return
    }
    const { sessionId } = await res.json()

    const params = new URLSearchParams({
      sessionId,
      technology: formData.technology,
      company: formData.company,
      level: formData.level,
      duration: formData.duration.toString(),
    })

    router.push(`/interview?${params.toString()}`)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background: neon blobs + grid + scanlines */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,197,94,.08),transparent_45%),radial-gradient(circle_at_80%_25%,rgba(34,197,94,.06),transparent_40%),radial-gradient(circle_at_40%_85%,rgba(59,130,246,.055),transparent_45%)]" />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_42%,transparent_75%)]">
          <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.55)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.55)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,.7))]" />
        <div className="absolute inset-0 opacity-[.12] mix-blend-soft-light bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,.06)_3px,rgba(255,255,255,.06)_3px)] animate-scan" />
      </div>

      {/* Back button */}
      <div className="relative z-10 px-4 pt-6 sm:pt-8">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 rounded-full border border-green-600/40 bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-300 backdrop-blur transition hover:border-green-500/70 hover:text-green-200"
        >
          <FiArrowLeft />
          Back
        </button>
      </div>

      {/* Card */}
      <section className="relative z-10 flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-green-700/40 bg-gradient-to-br from-gray-950/80 via-gray-900/60 to-black/80 p-6 sm:p-8 shadow-[0_0_60px_rgba(34,197,94,.15)] backdrop-blur">
          <header className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              <span className="text-green-400">🧠 Ace</span> Your DSA Interview
            </h1>
            <p className="mx-auto mt-3 max-w-md text-gray-300">
              Configure your mock DSA interview and get started instantly.
            </p>

            {/* Plan banner (when available) */}
            {planInfo && (
              <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/60 px-3 py-1 text-xs text-gray-300">
                Plan: <span className="text-green-300">{planInfo.plan.label}</span>
                <span className="text-gray-500">•</span>
                Used {planInfo.usage.interviewsCount}/{planInfo.plan.monthlyInterviewCap} this month
                <span className="text-gray-500">•</span>
                Max {planInfo.plan.maxMinutesPerInterview} min/session
              </div>
            )}
          </header>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Interview focus (fixed) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-green-300">
                <span className="flex items-center gap-2">
                  <FiSettings /> Interview Focus
                </span>
              </label>
              <input
                disabled
                value="Data Structures & Algorithms"
                className="w-full rounded-xl border border-gray-800 bg-gray-850/70 px-4 py-3 text-white outline-none ring-emerald-500/0 transition focus:ring-2 disabled:cursor-not-allowed"
              />
            </div>

            {/* Company */}
            <div className="relative">
              <label className="mb-1 block text-sm font-medium text-green-300">
                <span className="flex items-center gap-2">
                  <FiBriefcase /> Target Company
                </span>
              </label>
              <input
                name="company"
                required
                placeholder="e.g., Google, Flipkart, OpenAI"
                value={formData.company}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-3 text-white outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Level */}
            <div>
              <label className="mb-1 block text-sm font-medium text-green-300">
                <span className="flex items-center gap-2">
                  <FiTrendingUp /> Difficulty Level
                </span>
              </label>
              <select
                name="level"
                required
                value={formData.level}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-3 text-white outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-500"
              >
                <option value="" disabled>
                  Select difficulty
                </option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Duration with number + slider (mobile friendly) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-green-300">
                <span className="flex items-center gap-2">
                  <FiClock /> Interview Duration (minutes)
                </span>
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <input
                  name="duration"
                  type="number"
                  min={5}
                  max={60}
                  required
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-3 text-white outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-500"
                />
                <div className="hidden sm:block text-sm text-gray-400">
                  (min 5, max 60)
                </div>
              </div>

              <input
                aria-label="Duration slider"
                type="range"
                min={5}
                max={60}
                step={5}
                value={formData.duration}
                onChange={e =>
                  setFormData(p => ({ ...p, duration: parseInt(e.target.value) }))
                }
                className="mt-3 w-full accent-green-500"
              />
            </div>

            {/* Hints / warnings */}
            <div className="space-y-2">
              {capReached && (
                <p className="rounded-lg border border-yellow-700/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">
                  You’ve reached your monthly interview limit on{' '}
                  <span className="font-medium">{planInfo?.plan.label}</span>. Upgrade for more sessions.
                </p>
              )}
              {tooLong && (
                <p className="rounded-lg border border-yellow-700/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">
                  Your plan allows a maximum of{' '}
                  <span className="font-medium">
                    {planInfo?.plan.maxMinutesPerInterview} minutes
                  </span>{' '}
                  per session. Reduce duration or upgrade your plan.
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || capReached || tooLong}
              className="relative mt-2 w-full cursor-pointer rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-lg font-bold text-white transition-all hover:from-emerald-500 hover:to-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:opacity-50"
            >
              <span className="absolute inset-0 -z-10 rounded-2xl bg-green-500/25 blur-xl" />
              {capReached
                ? 'Monthly limit reached — Upgrade'
                : tooLong
                  ? `Max ${planInfo?.plan.maxMinutesPerInterview} min on ${planInfo?.plan.label}`
                  : loading
                    ? 'Starting…'
                    : 'Start DSA Interview'}
            </button>
          </form>
        </div>
      </section>

      {/* Local animations */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 12s linear infinite;
          background-size: auto 6px;
        }
      `}</style>
    </main>
  )
}
