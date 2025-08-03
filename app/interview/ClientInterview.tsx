"use client";

import { useEffect, useRef, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiX,
  FiMessageSquare,
  FiCode,
  FiLoader,
} from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import { getPromptsForInterview, SUMMARY_PROMPT } from "@/lib/prompts";

// Free Usage
// const speak = (text: string, onEnd?: () => void) => {
//   const normalizedText = text.replace(/\bO\(([^)]+)\)/g, "Big O of $1");
//   const utterance = new SpeechSynthesisUtterance(normalizedText);
//   utterance.lang = "en-US";
//   utterance.rate = 1;
//   utterance.pitch = 1;
//   if (onEnd) utterance.onend = onEnd;
//   window.speechSynthesis.speak(utterance);
// };


// Using AWS Polly
/** fetches an MP3 from our /api/tts and plays it */
async function speak(text: string, onEnd?: () => void) {
  try {
    const normalized = text.replace(/\bO\(([^)]+)\)/g, "Big O of $1");
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: normalized }),
    });
    if (!res.ok) throw new Error("TTS failed");

    // assume API returns audio/mpeg
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      onEnd?.();
    };
    audio.play();
  } catch (error) {
    console.error("TTS error:", error);
    // fallback to built-in
    const ut: any = new SpeechSynthesisUtterance(text);
    ut.onend = onEnd;
    window.speechSynthesis.speak(ut);
  }
}

export default function InterviewPage() {
  const [aiReply, setAiReply] = useState("");
  const [history, setHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [endLoading, setEndLoading] = useState(false)
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [userCode, setUserCode] = useState("");

  // --- NEW STATE for view management ---
  const [activeView, setActiveView] = useState<"question" | "editor">(
    "question"
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const hasStartedRef = useRef(false);
  const { isSignedIn } = useAuth();
  const searchParams = useSearchParams();

  const technology = searchParams.get("technology") ?? "React";
  const company = searchParams.get("company") ?? "";
  const level = searchParams.get("level") ?? "Junior";
  const duration = parseInt(searchParams.get("duration") ?? "15", 10);

  const router = useRouter();

  const { transcript, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  useEffect(() => {
    if (!cameraOn) {
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
  }, [cameraOn]);

  useEffect(() => {
    if (!transcript.trim()) return;
    window.speechSynthesis.cancel();
    const timeout = setTimeout(() => {
      const spoken = transcript.trim();
      resetTranscript();
      sendMessage(spoken);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [transcript, resetTranscript]);

  const startListening = () => {
    if (browserSupportsSpeechRecognition && micOn) {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: "en-US" });
    }
  };

  // Clean up on page unload
  useEffect(() => {
    const cleanUp = () => {
      window.speechSynthesis.cancel();
      SpeechRecognition.stopListening();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
    window.addEventListener("beforeunload", cleanUp);
    return () => {
      window.removeEventListener("beforeunload", cleanUp);
    };
  }, []);

  useEffect(() => {
    if (
      !isSignedIn ||
      hasStartedRef.current ||
      !browserSupportsSpeechRecognition
    )
      return;
    hasStartedRef.current = true;
    const startInterview = async () => {
      setLoading(true);
      const prompt = getPromptsForInterview(
        technology,
        duration,
        company,
        level
      );
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [], systemPrompt: prompt }),
      });
      const data = await res.json();

      const assistantMsg = { role: "assistant" as const, content: data.reply };
      setHistory([assistantMsg]);
      setAiReply(data.reply);
      setLoading(false);

      setTimeout(
        () => speak(data.reply, () => micOn && startListening()),
        1000
      );
    };
    startInterview();
  }, [
    isSignedIn,
    browserSupportsSpeechRecognition,
    company,
    duration,
    level,
    technology,
    micOn,
  ]);

  const sendMessage = async (userInput: string) => {
    setLoading(true);
    const userMsg = { role: "user" as const, content: userInput };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);

    const prompt = getPromptsForInterview(technology, duration, company, level);
    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newHistory, systemPrompt: prompt }),
    });
    const data = await res.json();

    const assistantMsg = { role: "assistant" as const, content: data.reply };
    setHistory([...newHistory, assistantMsg]);
    setAiReply(data.reply);
    setLoading(false);
    setActiveView("question"); // Switch back to question view on new question

    speak(data.reply, () => micOn && startListening());
  };

  useEffect(() => {
    const stopSpeaking = () => window.speechSynthesis.cancel();
    window.addEventListener("beforeunload", stopSpeaking);
    return () => {
      stopSpeaking();
      window.removeEventListener("beforeunload", stopSpeaking);
    };
  }, []);

  const toggleMic = () => {
    const newMicState = !micOn;
    setMicOn(newMicState);
    if (newMicState) {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: "en-US" });
    } else {
      SpeechRecognition.stopListening();
    }
  };

  const handleEndInterview = async () => {
    setEndLoading(true);
    setCameraOn(false);
    window.speechSynthesis.cancel();
    SpeechRecognition.stopListening();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    const sessionId = searchParams.get("sessionId");
    if (sessionId) {
      try {
        // 4. get a final summary/feedback from the AI
        const resSummary = await fetch("/api/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemPrompt: SUMMARY_PROMPT,
            messages: history,
          }),
        });
        const { reply: feedback } = await resSummary.json();

        // 5. persist that feedback in your DB
        await fetch("/api/update-interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, feedback }),
        });
      } catch (e) {
        console.error("Error sending final feedback", e);
      } finally {
        setEndLoading(false);
      }
    }
    router.push("/start-interview");
  };

  const handleCodeSubmit = async () => {
    if (!userCode.trim()) return;

    setLoading(true);
    const userMsg = {
      role: "user" as const,
      content: `Here is my code:\n${userCode.trim()}`,
    };
    const newHistory = [...history, userMsg];

    const prompt = getPromptsForInterview(technology, duration, company, level);
    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newHistory, systemPrompt: prompt }),
    });
    const data = await res.json();

    const assistantMsg = { role: "assistant" as const, content: data.reply };
    setHistory([...newHistory, assistantMsg]);
    setAiReply(data.reply);
    setLoading(false);
    setActiveView("question"); // Go back to see feedback

    speak(data.reply, () => micOn && startListening());
  };

  return (
    <>
      <SignedIn>
        <main className="min-h-screen bg-black text-white flex flex-col p-4 gap-4">
          <header className="flex justify-between items-center w-full">
            <h1 className="text-lg sm:text-xl font-semibold text-green-400">
              Mock Interview
            </h1>
            <button
              onClick={handleEndInterview}
              disabled={endLoading}
              className={`flex items-center gap-2 text-sm font-medium transition-colors
                    ${
                      endLoading
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-red-500 hover:text-red-400 cursor-pointer"
                    }`}
            >
              {endLoading ? (
                <FiLoader className="animate-spin" size={18} />
              ) : (
                <FiX size={18} />
              )}
              {endLoading ? " Ending…" : " End Interview"}
            </button>
          </header>

          {/* Video Feed and Controls Section */}
          <section className="flex flex-col items-center justify-center gap-3">
            <div className="w-full max-w-xl aspect-video bg-black rounded-lg overflow-hidden border border-gray-700 shadow-lg relative">
              {cameraOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500 flex-col gap-2">
                  <FiVideoOff size={40} />
                  <span>Camera Off</span>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-full ${
                  micOn ? "bg-red-600" : "bg-green-600"
                } hover:opacity-90 transition`}
              >
                {micOn ? <FiMicOff size={20} /> : <FiMic size={20} />}
              </button>
              <button
                onClick={() => setCameraOn(!cameraOn)}
                className={`p-3 rounded-full ${
                  cameraOn ? "bg-red-600" : "bg-green-600"
                } hover:opacity-90 transition`}
              >
                {cameraOn ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
              </button>
            </div>
            <div className="w-full max-w-xl bg-gray-900/50 border border-gray-800 p-2.5 rounded-lg text-xs text-green-300 font-mono mt-1">
              🎙️ {transcript || "..."}
            </div>
          </section>

          {/* Main Workspace Area */}
          <section className="flex-1 flex flex-col bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveView("question")}
                className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  activeView === "question"
                    ? "bg-green-900/50 text-green-300 border-b-2 border-green-400"
                    : "text-gray-400 hover:bg-gray-800"
                }`}
              >
                <FiMessageSquare /> Question
              </button>
              <button
                onClick={() => setActiveView("editor")}
                className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  activeView === "editor"
                    ? "bg-green-900/50 text-green-300 border-b-2 border-green-400"
                    : "text-gray-400 hover:bg-gray-800"
                }`}
              >
                <FiCode /> Code Editor
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
              {activeView === "question" && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <FiLoader className="animate-spin" size={24} />
                      <span>AI is thinking...</span>
                    </div>
                  ) : (
                    <p className="text-lg sm:text-xl text-green-200 leading-relaxed max-w-3xl">
                      {aiReply}
                    </p>
                  )}
                </div>
              )}
              {activeView === "editor" && (
                <div className="flex flex-col h-full">
                  <textarea
                    placeholder="// Your code goes here..."
                    className="flex-1 w-full bg-black/50 border border-gray-700 rounded-md p-4 font-mono text-sm text-gray-200 focus:ring-2 focus:ring-green-500 focus:outline-none resize-none transition"
                    style={{ minHeight: "250px" }}
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                  />
                  <button
                    onClick={handleCodeSubmit}
                    className="mt-4 self-end bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                  >
                    Submit Code
                  </button>
                </div>
              )}
            </div>
          </section>
        </main>
      </SignedIn>
      <SignedOut>
        <div className="flex items-center justify-center h-screen bg-black text-white flex-col gap-4">
          <p>You need to sign in to access the interview.</p>
          <SignInButton />
        </div>
      </SignedOut>
    </>
  );
}
