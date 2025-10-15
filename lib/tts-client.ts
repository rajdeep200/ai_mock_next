// lib/tts-client.ts
"use client";

// Small, reusable TTS helper you can use anywhere.
// Keeps the object URL cache & audio instance outside the page.

const ttsCache = new Map<string, string>(); // text -> objectURL

let audioEl: HTMLAudioElement | null = null;
let lastUrl: string | null = null;

export function cancelTTS() {
    try {
        if (audioEl) {
            audioEl.pause();
            audioEl.src = "";
            audioEl = null;
        }
        if (lastUrl) {
            URL.revokeObjectURL(lastUrl);
            lastUrl = null;
        }
    } catch { }
}

export async function prepareTTS(text: string): Promise<string | null> {
    // normalize Big-O for better speech
    const normalized = text.replace(/\bO\(([^)]+)\)/g, "Big O of $1");

    if (ttsCache.has(normalized)) return ttsCache.get(normalized)!;

    try {
        const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // NOTE: If you want Matthew neural vs Raveena standard, set via env/UX.
            body: JSON.stringify({ text: normalized }),
        });
        if (!res.ok) return null;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        ttsCache.set(normalized, url);
        return url;
    } catch {
        return null;
    }
}

export async function playTTS(url: string, onEnd?: () => void) {
    cancelTTS(); // stop any previous audio
    lastUrl = url;
    audioEl = new Audio(url);
    audioEl.onended = () => onEnd?.();
    audioEl.onerror = () => onEnd?.();
    try {
        await audioEl.play();
    } catch {
        onEnd?.(); // autoplay blocked
    }
}
