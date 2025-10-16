// hooks/useInterviewEngine.ts
"use client";

import { useEffect, useRef, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { useAuth } from "@clerk/nextjs";
import { getPromptsForInterview, SUMMARY_PROMPT } from "@/lib/prompts";
import { decrypt, encrypt } from "@/lib/crypto";
import { prepareTTS, playTTS, cancelTTS } from "@/lib/tts-client";
import { useRouter, useSearchParams } from "next/navigation";

type Stage = "intro" | "clarify" | "coding" | "review" | "wrapup";
type ChatRole = "user" | "assistant" | "system";

const TIME_WARNINGS_S = [300, 120, 60];
const END_TOKEN_REGEX = /(?:\[|<)?\s*END[\s_\-]*INTERVIEW\s*(?:\]|>|\/>)?/i;
const containsEndToken = (text: string) => !!text && END_TOKEN_REGEX.test(text);
const ENC_KEY = process.env.NEXT_PUBLIC_ENC_KEY!;

export function useInterviewEngine(technology: string, company: string, level: string) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isSignedIn } = useAuth();
    const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

    // --- UI state exposed back to the page ---
    const [aiReply, setAiReply] = useState("");
    const [history, setHistory] = useState<{ role: ChatRole; content: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [endLoading, setEndLoading] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [stage, setStage] = useState<Stage>("intro");
    const [activeView, setActiveView] = useState<"question" | "editor">("question");
    const [userCode, setUserCode] = useState("");
    const [ended, setEnded] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number>(0);

    // --- plan & duration ---
    const requestedDuration = parseInt(searchParams.get("duration") ?? "15", 10);
    const [allowedMinutes, setAllowedMinutes] = useState<number | undefined>(undefined);
    const [planMax, setPlanMax] = useState<number | null>(null);
    const [wasClamped, setWasClamped] = useState(false);

    // --- refs ---
    const endAtRef = useRef<number | undefined>(undefined);
    const lastActivityRef = useRef<number>(Date.now());
    const warnedAtSecondsRef = useRef<Set<number>>(new Set());
    const hasStartedRef = useRef(false);
    const lastAgentActivityRef = useRef<number>(Date.now());
    const silenceTriggeredRef = useRef<boolean>(false);
    const endedRef = useRef(false);

    // --- helpers ---
    const markActivity = () => {
        lastActivityRef.current = Date.now();
        silenceTriggeredRef.current = false;
    };
    const startListening = () => {
        if (endedRef.current) return;
        if (browserSupportsSpeechRecognition && micOn) {
            resetTranscript();
            SpeechRecognition.startListening({ continuous: true, language: "en-US" });
        }
    };
    const stopListening = () => {
        try { SpeechRecognition.stopListening(); } catch { }
    };

    // --- transcript watcher: convert to user message ---
    useEffect(() => {
        if (!transcript.trim()) return;
        cancelTTS(); // stop AI voice if user starts speaking
        const t = setTimeout(() => {
            const spoken = transcript.trim();
            resetTranscript();
            markActivity();
            void sendMessage(spoken);
        }, 1500);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transcript]);

    // --- fetch plan limits first ---
    useEffect(() => {
        if (!isSignedIn) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/plan", { cache: "no-store" });
                if (!res.ok) {
                    if (!cancelled) {
                        setAllowedMinutes(requestedDuration);
                        setPlanMax(null);
                        setWasClamped(false);
                    }
                    return;
                }
                const data = await res.json();
                const max = Number(data?.plan?.maxMinutesPerInterview ?? requestedDuration);
                const clamped = Math.min(requestedDuration, max);
                if (!cancelled) {
                    setPlanMax(max);
                    setAllowedMinutes(clamped);
                    setWasClamped(clamped !== requestedDuration);
                }
            } catch {
                if (!cancelled) {
                    setAllowedMinutes(requestedDuration);
                    setPlanMax(null);
                    setWasClamped(false);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [isSignedIn, requestedDuration]);

    // --- start the interview once limits are known ---
    useEffect(() => {
        if (!isSignedIn || hasStartedRef.current || !browserSupportsSpeechRecognition) return;
        if (allowedMinutes === undefined) return;

        hasStartedRef.current = true;
        endAtRef.current = Date.now() + allowedMinutes * 60 * 1000;
        setTimeLeft(allowedMinutes * 60);

        (async () => {
            setLoading(true);
            const prompt = getPromptsForInterview(technology, allowedMinutes, company, level);
            const encPayload = await encrypt({ messages: [], systemPrompt: prompt }, ENC_KEY);
            const res = await fetch("/api/interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(encPayload),
            });
            const encOut = await res.json();
            const data = await decrypt<{ reply: string }>(encOut, ENC_KEY);

            const url = await prepareTTS(data.reply); // prepare audio BEFORE drawing text

            const assistantMsg = { role: "assistant" as const, content: data.reply };
            setHistory([assistantMsg]);
            setAiReply(data.reply);
            lastAgentActivityRef.current = Date.now();
            silenceTriggeredRef.current = false;
            setLoading(false);

            if (containsEndToken(data.reply)) {
                await handleEndInterview({ auto: true });
                return;
            }

            markActivity();
            setStage("intro");
            requestAnimationFrame(() => {
                if (url) void playTTS(url, () => micOn && startListening());
                else if (micOn) startListening();
            });
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSignedIn, browserSupportsSpeechRecognition, technology, company, level, micOn, allowedMinutes]);

    // --- proactive loop: timer + silence nudge ---
    useEffect(() => {
        const tick = setInterval(() => {
            if (endAtRef.current === undefined) return;

            const secsLeft = Math.ceil((endAtRef.current - Date.now()) / 1000);
            const safe = Math.max(0, secsLeft);
            setTimeLeft(safe);

            if (secsLeft <= 0 && !endedRef.current) {
                void handleEndInterview({ auto: true });
                return;
            }

            for (const warn of TIME_WARNINGS_S) {
                if (safe <= warn && !warnedAtSecondsRef.current.has(warn)) {
                    warnedAtSecondsRef.current.add(warn);
                    void assistantPush(
                        warn >= 120
                            ? `Time check: about ${Math.round(warn / 60)} minutes left.`
                            : "About 1 minute left—try to finalize your approach."
                    );
                }
            }

            if (safe <= 30 && stage !== "wrapup") setStage("wrapup");

            const now = Date.now();
            const userIdle = now - lastActivityRef.current;
            const aiIdle = now - lastAgentActivityRef.current;

            if (userIdle >= 120_000 && aiIdle >= 120_000 && !silenceTriggeredRef.current && !endedRef.current) {
                silenceTriggeredRef.current = true;
                void sendSilenceSystemEvent();
            }
        }, 1000);

        return () => clearInterval(tick);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stage, micOn]);

    // --- actions exposed back to UI ---

    async function sendMessage(userInput: string) {
        if (endedRef.current) return;
        setLoading(true);
        if (/start.*code|let.?s code|i'?ll start/i.test(userInput)) setStage("coding");
        else if (/complexity|big ?o/i.test(userInput)) setStage("review");

        const userMsg = { role: "user" as const, content: userInput };
        const newHistory = [...history, userMsg];
        setHistory(newHistory);

        const prompt = getPromptsForInterview(technology, allowedMinutes ?? requestedDuration, company, level);
        const encPayload = await encrypt({ messages: newHistory, systemPrompt: prompt }, ENC_KEY);
        const res = await fetch("/api/interview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(encPayload),
        });
        const encOut = await res.json();
        const data = await decrypt<{ reply: string }>(encOut, ENC_KEY);

        const url = await prepareTTS(data.reply);

        const assistantMsg = { role: "assistant" as const, content: data.reply };
        setHistory([...newHistory, assistantMsg]);
        setAiReply(data.reply);
        lastAgentActivityRef.current = Date.now();
        silenceTriggeredRef.current = false;
        setLoading(false);
        setActiveView("question");
        markActivity();

        if (containsEndToken(data.reply)) {
            await handleEndInterview({ auto: true });
            return;
        }

        requestAnimationFrame(() => {
            if (url) void playTTS(url, () => micOn && startListening());
            else if (micOn) startListening();
        });
    }

    async function handleCodeSubmit() {
        if (endedRef.current) return;
        if (!userCode.trim()) return;
        setLoading(true);
        setStage("review"); // optional, since you track stages
        const userMsg = { role: "user" as const, content: `Here is my code:\n${userCode.trim()}` };
        const newHistory = [...history, userMsg];

        const prompt = getPromptsForInterview(
            technology,
            allowedMinutes ?? requestedDuration,
            company,
            level
        );

        const encPayload = await encrypt({ messages: newHistory, systemPrompt: prompt }, ENC_KEY);
        const res = await fetch("/api/interview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(encPayload),
        });
        const encOut = await res.json();
        const data = await decrypt<{ reply: string }>(encOut, ENC_KEY);

        // prep TTS first so UI + audio feel simultaneous
        const url = await prepareTTS(data.reply);

        const assistantMsg = { role: "assistant" as const, content: data.reply };
        setHistory([...newHistory, assistantMsg]);
        setAiReply(data.reply);
        lastAgentActivityRef.current = Date.now();
        silenceTriggeredRef.current = false;
        setLoading(false);
        setActiveView("question");
        markActivity();

        if (containsEndToken(data.reply)) {
            await handleEndInterview({ auto: true });
            return;
        }

        // play TTS, then reopen mic
        requestAnimationFrame(() => {
            if (url) void playTTS(url, () => micOn && startListening());
            else if (micOn) startListening();
        });

        // optional follow-up nudge after code review
        // setTimeout(() => {
        //   void assistantPush("Walk me through the time and space complexity, and any edge cases you tested.");
        // }, 1200);
    }

    async function sendSilenceSystemEvent() {
        if (endedRef.current || loading) return;
        try {
            const sys: { role: ChatRole; content: string } = {
                role: "system",
                content: "The candidate has been silent for more than 2 minutes. Briefly check in (≤1 sentence) and ask if they need a hint or have any issue."
            };

            const newHistory = [...history, sys];
            setHistory(newHistory);

            setLoading(true);
            const prompt = getPromptsForInterview(technology, allowedMinutes, company, level);
            const encPayload = await encrypt({ messages: newHistory, systemPrompt: prompt }, ENC_KEY);
            const res = await fetch("/api/interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(encPayload),
            });
            const encOut = await res.json();
            const data = await decrypt<{ reply: string }>(encOut, ENC_KEY);

            const url = await prepareTTS(data.reply);

            const assistantMsg = { role: "assistant" as const, content: data.reply };
            setHistory([...newHistory, assistantMsg]);
            setAiReply(data.reply);
            lastAgentActivityRef.current = Date.now();
            silenceTriggeredRef.current = true;
            setLoading(false);

            requestAnimationFrame(() => {
                if (url) void playTTS(url, () => micOn && startListening());
                else if (micOn) startListening();
            });
        } catch (e) {
            console.error("[SILENCE_EVENT_ERROR]", e);
            setLoading(false);
        }
    }

    async function assistantPush(text: string) {
        const msg = { role: "assistant" as const, content: text };
        setHistory((h) => [...h, msg]);
        setAiReply(text);
        lastAgentActivityRef.current = Date.now();
        silenceTriggeredRef.current = false;

        const url = await prepareTTS(text);
        requestAnimationFrame(() => {
            if (url) void playTTS(url, () => micOn && startListening());
            else if (micOn) startListening();
        });
    }

    async function handleEndInterview(opts?: { auto?: boolean }) {
        if (endedRef.current) return;
        endedRef.current = true;
        setEnded(true);

        setEndLoading(true);
        setCameraOn(false);
        endAtRef.current = undefined;

        cancelTTS();
        stopListening();

        const sessionId = searchParams.get("sessionId");

        try {
            if (sessionId) {
                const encPayload = await encrypt({ messages: history, systemPrompt: SUMMARY_PROMPT }, ENC_KEY);
                const resSummary = await fetch("/api/interview", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(encPayload),
                });

                let feedback = "";
                if (resSummary.ok) {
                    const response = await resSummary.json();
                    const { reply } = await decrypt(response, ENC_KEY);
                    feedback = reply ?? "";
                }

                let modelPrepPercent: number | undefined;
                const m = feedback.match(/Preparation Percentage:\s*(\d{1,3})%/i);
                if (m) {
                    const n = Math.min(100, Math.max(0, parseInt(m[1], 10)));
                    if (!Number.isNaN(n)) modelPrepPercent = n;
                } else if (/Preparation Percentage:\s*N\/A/i.test(feedback)) {
                    modelPrepPercent = undefined;
                }

                const encPayloadSummary = await encrypt(
                    { sessionId, feedback, ...(typeof modelPrepPercent === "number" ? { modelPreparationPercent: modelPrepPercent } : {}) },
                    ENC_KEY
                );

                await fetch("/api/update-interview", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(encPayloadSummary),
                });
            }
        } catch (e) {
            console.error("Error finalizing interview", e);
        } finally {
            setEndLoading(false);
            const session = searchParams.get("sessionId") ?? "";
            router.replace(`/interview/feedback?sessionId=${encodeURIComponent(session)}`);
        }
    }

    function toggleMic() {
        const next = !micOn;
        setMicOn(next);
        if (next) {
            resetTranscript();
            SpeechRecognition.startListening({ continuous: true, language: "en-US" });
        } else {
            stopListening();
        }
        markActivity();
    }

    return {
        // state
        aiReply, history, loading, endLoading, micOn, cameraOn, stage, activeView, userCode, ended,
        timeLeft, allowedMinutes, planMax, wasClamped,
        // setters for UI
        setActiveView, setUserCode, setCameraOn,
        // actions
        toggleMic, sendMessage, assistantPush, handleEndInterview, handleCodeSubmit
    };
}
