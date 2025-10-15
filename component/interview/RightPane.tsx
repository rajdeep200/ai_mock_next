// components/interview/RightPane.tsx
"use client";

import { FiLoader, FiMessageSquare, FiCode } from "react-icons/fi";
import Link from "next/link";
import { ReactNode } from "react";

export default function RightPane({
    loading,
    aiReply,
    activeView,
    setActiveView,
    wasClamped,
    requestedDuration,
    allowedMinutes,
    planMax,
    editor,
}: {
    loading: boolean;
    aiReply: string;
    activeView: "question" | "editor";
    setActiveView: (v: "question" | "editor") => void;
    wasClamped: boolean;
    requestedDuration: number;
    allowedMinutes?: number;
    planMax: number | null;
    editor: ReactNode; // pass Monaco wrapper from the page
}) {
    return (
        <div className="flex flex-col rounded-2xl border border-emerald-500/25 bg-gray-950/70 backdrop-blur shadow-[0_0_28px_rgba(16,185,129,.15)] ring-1 ring-emerald-500/10 overflow-hidden">
            {/* Tabs */}
            <div className="relative flex border-b border-gray-800">
                <button
                    onClick={() => setActiveView("question")}
                    className={`cursor-pointer flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-all
            ${activeView === "question" ? "text-emerald-300" : "text-gray-400 hover:text-gray-100"}`}
                >
                    <span className={`absolute inset-x-0 bottom-0 h-[3px] transition-all ${activeView === "question" ? "bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-400" : "bg-transparent"}`} />
                    <FiMessageSquare /> Question
                </button>
                <button
                    onClick={() => setActiveView("editor")}
                    className={`cursor-pointer flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-all
            ${activeView === "editor" ? "text-emerald-300" : "text-gray-400 hover:text-gray-100"}`}
                >
                    <span className={`absolute inset-x-0 bottom-0 h-[3px] transition-all ${activeView === "editor" ? "bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-400" : "bg-transparent"}`} />
                    <FiCode /> Code Editor
                </button>
            </div>

            {/* Notices (optional clamp message) */}
            {wasClamped && (
                <div className="px-4 pt-3">
                    <div className="w-full bg-yellow-900/35 border border-yellow-700/70 text-yellow-200 text-sm rounded-xl px-3 py-2 backdrop-blur">
                        Requested {requestedDuration}m, plan allows max {planMax}m. Adjusted to <b>{allowedMinutes}m</b>.{" "}
                        <Link href="/pricing" className="underline text-yellow-300 hover:text-yellow-50">Upgrade your plan</Link> for longer sessions.
                    </div>
                </div>
            )}

            {/* Panel */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                {activeView === "question" ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        {loading ? (
                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                <div className="relative">
                                    <FiLoader className="animate-spin text-emerald-400" size={28} />
                                    <span className="absolute inset-0 blur-sm opacity-40 text-emerald-400">
                                        <FiLoader className="animate-spin" size={28} />
                                    </span>
                                </div>
                                <span>AI is thinking…</span>
                            </div>
                        ) : (
                            <p className="text-lg sm:text-xl text-emerald-200/90 leading-relaxed max-w-3xl">
                                {aiReply}
                            </p>
                        )}
                    </div>
                ) : (
                    editor
                )}
            </div>
        </div>
    );
}
