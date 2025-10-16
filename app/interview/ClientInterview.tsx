// app/interview/page.tsx
"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useInterviewEngine } from "@/hooks/useInterviewEngine";
import InterviewHeader from "@/component/interview/InterviewHeader";
import LeftPane from "@/component/interview/LeftPane";
import RightPane from "@/component/interview/RightPane";
import MonacoEditorPane from "@/component/interview/MonacoEditorPane";
import { useSearchParams } from "next/navigation";

export default function InterviewPage() {
  const searchParams = useSearchParams();
  const technology = searchParams.get("technology") ?? "React";
  const company = searchParams.get("company") ?? "";
  const level = searchParams.get("level") ?? "Junior";

  const {
    aiReply, loading, endLoading, micOn, cameraOn, stage, activeView, userCode, ended,
    timeLeft, allowedMinutes, planMax, wasClamped,
    setActiveView, setUserCode, setCameraOn,
    toggleMic, handleEndInterview, handleCodeSubmit, displayTranscript
  } = useInterviewEngine(technology, company, level);

  const language = (() => {
    const tech = (technology || "").toLowerCase();
    if (tech.includes("python")) return "python";
    if (tech.includes("java")) return "java";
    if (tech.includes("c++") || tech.includes("cpp")) return "cpp";
    if (tech.includes("go")) return "go";
    if (tech.includes("ts")) return "typescript";
    return "javascript";
  })();

  return (
    <>
      <SignedIn>
        <main className="relative min-h-screen bg-black text-white flex flex-col overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0">
              <div className="animate-float-slow absolute top-[-40px] left-[10%] h-72 w-72 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="animate-float-medium absolute bottom-[-60px] right-[5%] h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="animate-float-fast absolute top-[30%] right-[30%] h-40 w-40 rounded-full bg-green-300/10 blur-2xl" />
            </div>
            <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px)] bg-[length:100%_3px]" />
            <div className="absolute inset-0 opacity-40 [mask-image:radial-gradient(50%_70%_at_50%_60%,black,transparent)]">
              <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.5)_1px,transparent_1px)] bg-[size:48px_48px]" />
            </div>
          </div>

          {/* Header */}
          <InterviewHeader
            timeLeft={timeLeft}
            endLoading={endLoading}
            ended={ended}
            onEnd={() => void handleEndInterview()}
          />

          {/* Main grid */}
          <section className="relative z-10 flex-1 px-4 sm:px-6 py-5">
            <div className="mx-auto grid w-full gap-6 lg:gap-7 lg:grid-cols-2">
              <LeftPane
                cameraOn={cameraOn}
                setCameraOn={setCameraOn}
                micOn={micOn}
                toggleMic={toggleMic}
                ended={ended}
                transcript={displayTranscript}
              />

              <RightPane
                loading={loading}
                aiReply={aiReply}
                activeView={activeView}
                setActiveView={setActiveView}
                wasClamped={wasClamped}
                requestedDuration={parseInt(searchParams.get("duration") ?? "15", 10)}
                allowedMinutes={allowedMinutes}
                planMax={planMax}
                editor={
                  <MonacoEditorPane
                    language={language}
                    value={userCode}
                    onChange={setUserCode}
                    onSubmit={handleCodeSubmit}
                    disabled={ended}
                  />
                }
              />
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
