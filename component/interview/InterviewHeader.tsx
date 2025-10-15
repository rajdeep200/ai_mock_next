// components/interview/InterviewHeader.tsx
"use client";

import { FiLoader, FiX } from "react-icons/fi";

export default function InterviewHeader({
    timeLeft,
    endLoading,
    ended,
    onEnd,
}: {
    timeLeft: number;
    endLoading: boolean;
    ended: boolean;
    onEnd: () => void;
}) {
    return (
        <header className="relative z-10 w-full px-4 sm:px-6 py-3 border-b border-gray-800/70 backdrop-blur bg-black/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative">
                    <h1 className="text-base sm:text-lg font-semibold tracking-wide">
                        <span className="bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-200 bg-clip-text text-transparent">
                            Mock Interview
                        </span>
                    </h1>
                    <span className="absolute -bottom-1 left-0 h-[2px] w-20 bg-gradient-to-r from-emerald-500 to-transparent" />
                </div>

                <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
                    <span
                        className="whitespace-nowrap inline-flex items-center gap-2 text-[11px] sm:text-xs px-2.5 py-1 rounded-full
            border border-emerald-500/40 bg-gray-900/70 ring-1 ring-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,.22)]"
                        title="Remaining time"
                    >
                        <span className="hidden sm:block text-gray-300">Time</span>
                        <span className="block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        {`⏱ ${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`}
                    </span>

                    <button
                        onClick={onEnd}
                        disabled={endLoading || ended}
                        className={`cursor-pointer whitespace-nowrap inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] sm:text-sm font-medium
              transition shadow-[0_0_14px_rgba(239,68,68,.18)]
              ${endLoading || ended
                                ? "cursor-not-allowed border border-gray-700/70 bg-gray-900/60 text-gray-400"
                                : "border border-red-500/30 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white"
                            }`}
                        aria-label="End Interview"
                    >
                        {endLoading ? <FiLoader className="animate-spin" size={16} /> : <FiX size={16} />}
                        <span className="hidden xs:inline">{endLoading ? "Ending…" : ended ? "Ended" : "End Interview"}</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
