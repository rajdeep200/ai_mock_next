// components/interview/LeftPane.tsx
"use client";

import { useEffect, useRef } from "react";
import { FiMic, FiMicOff, FiVideo, FiVideoOff } from "react-icons/fi";

export default function LeftPane({
    cameraOn,
    setCameraOn,
    micOn,
    toggleMic,
    ended,
    transcript,
}: {
    cameraOn: boolean;
    setCameraOn: (v: boolean) => void;
    micOn: boolean;
    toggleMic: () => void;
    ended: boolean;
    transcript: string;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    // Camera lifecycle (kept local to this pane)
    useEffect(() => {
        if (!cameraOn) {
            if (videoRef.current) videoRef.current.srcObject = null;
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach((t) => t.stop());
                mediaStreamRef.current = null;
            }
            return;
        }
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            mediaStreamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        });
        return () => {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach((t) => t.stop());
                mediaStreamRef.current = null;
            }
        };
    }, [cameraOn]);

    return (
        <div className="flex flex-col gap-4">
            {/* Holographic panel */}
            <div className="relative rounded-2xl overflow-hidden">
                <div className="hologram-border pointer-events-none absolute -inset-[1px] rounded-2xl" />
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-emerald-500/25 bg-gray-950/70 backdrop-blur shadow-[0_0_30px_rgba(16,185,129,.18)] ring-1 ring-emerald-500/10">
                    {cameraOn ? (
                        <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full bg-gray-900/70 flex items-center justify-center text-gray-400 flex-col gap-2">
                            <FiVideoOff size={42} />
                            <span>Camera Off</span>
                        </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(16,185,129,.08)_50%,transparent_100%)] animate-scan" />
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleMic}
                    disabled={ended}
                    className={`h-12 w-12 rounded-xl grid place-items-center transition border border-white/10 shadow-[0_0_20px_rgba(255,255,255,.06)]
            ${micOn ? "bg-red-600/90 hover:bg-red-600 ring-2 ring-red-400/30" : "bg-emerald-600/90 hover:bg-emerald-600 ring-2 ring-emerald-400/30"}
            disabled:opacity-50`}
                    title={micOn ? "Mute mic" : "Unmute mic"}
                >
                    {micOn ? <FiMicOff size={20} /> : <FiMic size={20} />}
                </button>

                <button
                    onClick={() => !ended && setCameraOn(!cameraOn)}
                    disabled={ended}
                    className={`h-12 w-12 rounded-xl grid place-items-center transition border border-white/10 shadow-[0_0_20px_rgba(255,255,255,.06)]
            ${cameraOn ? "bg-red-600/90 hover:bg-red-600 ring-2 ring-red-400/30" : "bg-emerald-600/90 hover:bg-emerald-600 ring-2 ring-emerald-400/30"}
            disabled:opacity-50`}
                    title={cameraOn ? "Turn camera off" : "Turn camera on"}
                >
                    {cameraOn ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
                </button>

                <div className="ml-auto inline-flex items-center gap-2 text-[11px] sm:text-xs px-2.5 py-1 rounded-full border border-gray-700 bg-gray-900/60 text-emerald-300">
                    <span className="block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                </div>
            </div>

            {/* Transcript */}
            <div className="w-full bg-gray-900/60 border border-gray-800 p-3 rounded-xl text-[12px] text-emerald-300 font-mono mt-1 backdrop-blur">
                <span className="opacity-70 mr-1">🎙️</span> {transcript || "…"}
            </div>
        </div>
    );
}
