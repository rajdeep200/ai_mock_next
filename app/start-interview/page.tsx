"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiSettings,
  FiBriefcase,
  FiTrendingUp,
  FiClock,
  FiArrowLeft,
} from "react-icons/fi";
import { useAuth } from '@clerk/nextjs';

export default function StartInterviewPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    technology: "dsa",
    company: "",
    level: "",
    duration: 30,
  });

  const router = useRouter();
  const { getToken } = useAuth()

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "duration" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = await getToken();

    const res = await fetch("/api/create-interview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        technology: formData.technology,
        company: formData.company,
        level: formData.level,
        duration: formData.duration,
      }),
    });

    if (!res.ok) {
      console.error("Failed to create session");
      setLoading(false);
      return;
    }
    const { sessionId } = await res.json();

    const params = new URLSearchParams({
      sessionId,
      technology: formData.technology,
      company: formData.company,
      level: formData.level,
      duration: formData.duration.toString(),
    });

    router.push(`/interview?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-green-950 flex items-center justify-center px-4 py-16 text-white relative">
      <div className="absolute top-16 left-6">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-green-400 hover:text-green-300 font-medium text-sm sm:text-base transition cursor-pointer"
        >
          <FiArrowLeft />
          Back
        </button>
      </div>

      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-green-600">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-center mb-4 text-green-400 tracking-tight">
          🧠 Ace Your DSA Interview
        </h1>
        <p className="text-center text-gray-300 mb-10 text-md sm:text-lg">
          Configure your mock DSA interview and get started instantly.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Technology - DSA fixed */}
          <div>
            <label className="block text-sm font-medium text-green-300 mb-1">
              <span className="flex items-center gap-2">
                <FiSettings /> Interview Focus
              </span>
            </label>
            <input
              disabled
              value="Data Structures & Algorithms"
              className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-green-700 cursor-not-allowed"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-green-300 mb-1">
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
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-green-700 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-medium text-green-300 mb-1">
              <span className="flex items-center gap-2">
                <FiTrendingUp /> Difficulty Level
              </span>
            </label>
            <select
              name="level"
              required
              value={formData.level}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-green-700 focus:ring-2 focus:ring-green-500 outline-none text-white"
            >
              <option value="" disabled>
                Select difficulty
              </option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-green-300 mb-1">
              <span className="flex items-center gap-2">
                <FiClock /> Interview Duration (minutes)
              </span>
            </label>
            <input
              name="duration"
              type="number"
              min={5}
              max={60}
              required
              value={formData.duration}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-green-700 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer w-full mt-4 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-600 rounded-xl text-white font-bold text-lg transition duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50"
          >
            {loading ? "Starting…" : "Start DSA Interview"}
          </button>
        </form>
      </div>
    </div>
  );
}
