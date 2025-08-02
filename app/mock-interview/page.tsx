'use client';

import { useEffect, useRef, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/nextjs';

type Role = 'user' | 'assistant';
type Message = { role: Role; content: string };

// 🔊 AI voice output
const speak = (text: string, onEnd?: () => void) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
};

export default function VideoInterview() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const hasStartedRef = useRef(false);
    const { isSignedIn } = useAuth();

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
    } = useSpeechRecognition();

    // 🎥 Show or Stop webcam
    useEffect(() => {
        if (!cameraOn) {
            if (videoRef.current) videoRef.current.srcObject = null;
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach((track) => track.stop());
                mediaStreamRef.current = null;
            }
            return;
        }

        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            mediaStreamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        });
    }, [cameraOn]);

    // 🎤 Auto send when user finishes speaking
    useEffect(() => {
        if (!transcript.trim()) return;

        const timeout = setTimeout(() => {
            const spoken = transcript.trim();
            resetTranscript();
            sendMessage(spoken);
        }, 2000);

        return () => clearTimeout(timeout);
    }, [transcript]);

    const startListening = () => {
        if (browserSupportsSpeechRecognition && micOn) {
            resetTranscript();
            SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
        }
    };

    // 🧠 Start interview on first load
    useEffect(() => {
        if (!isSignedIn || hasStartedRef.current || !browserSupportsSpeechRecognition) return;

        hasStartedRef.current = true;

        const startInterview = async () => {
            setLoading(true);
            const res = await fetch('/api/interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [] }),
            });

            const data = await res.json();
            const aiReply = data.reply;

            const assistantMsg: Message = { role: 'assistant', content: aiReply };
            setMessages([assistantMsg]);
            setLoading(false);

            setTimeout(() => {
                speak(aiReply, () => {
                    if (micOn) startListening();
                });
            }, 2000);
        };

        startInterview();
    }, [isSignedIn, browserSupportsSpeechRecognition]);

    // 👤 Send user response
    const sendMessage = async (userInput: string) => {
        const userMsg: Message = { role: 'user', content: userInput };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setLoading(true);

        const res = await fetch('/api/interview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: newMessages }),
        });

        const data = await res.json();
        const aiReply = data.reply;

        const assistantMsg: Message = { role: 'assistant', content: aiReply };
        const finalMessages = [...newMessages, assistantMsg];
        setMessages(finalMessages);
        setLoading(false);

        speak(aiReply, () => {
            if (micOn) startListening();
        });
    };

    // 🧹 Stop speech when navigating away
    useEffect(() => {
        const stopSpeaking = () => {
            window.speechSynthesis.cancel();
        };

        // Handle browser refresh or tab close
        window.addEventListener('beforeunload', stopSpeaking);

        // Handle route change
        // const unlisten = router.events?.on?.('routeChangeStart', stopSpeaking);

        return () => {
            stopSpeaking(); // On component unmount
            window.removeEventListener('beforeunload', stopSpeaking);
            // if (unlisten) router.events?.off?.('routeChangeStart', stopSpeaking);
        };
    }, []);

    return (
        <>
            <SignedIn>
                <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4">
                    <div className="flex w-full max-w-5xl gap-4">
                        {/* 🎥 Webcam */}
                        <div className="flex-1 relative">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-[60vh] rounded-xl border border-gray-700 object-cover"
                            />
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 p-2 text-sm rounded">
                                {transcript && <p className="italic text-green-300">{transcript}</p>}
                                {!listening && !loading && (
                                    <p className="text-gray-400">Waiting for next question...</p>
                                )}
                            </div>
                        </div>

                        {/* 💬 Chat log */}
                        <div className="w-[300px] bg-gray-900 p-4 rounded-xl overflow-y-auto h-[60vh] space-y-2 text-sm">
                            {messages.map((msg, i) => (
                                <div key={i} className={`text-${msg.role === 'user' ? 'blue' : 'yellow'}-400`}>
                                    <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
                                </div>
                            ))}
                            {loading && <p className="text-gray-500 italic">AI is thinking...</p>}
                        </div>
                    </div>

                    {/* 🎛️ Controls */}
                    <div className="mt-4 flex gap-4">
                        <button
                            onClick={() => setMicOn(!micOn)}
                            className={`px-4 py-2 rounded ${micOn ? 'bg-red-600' : 'bg-green-600'}`}
                        >
                            {micOn ? 'Turn Mic Off 🎙️' : 'Turn Mic On 🎙️'}
                        </button>

                        <button
                            onClick={() => setCameraOn(!cameraOn)}
                            className={`px-4 py-2 rounded ${cameraOn ? 'bg-red-600' : 'bg-green-600'}`}
                        >
                            {cameraOn ? 'Turn Camera Off 📷' : 'Turn Camera On 📷'}
                        </button>
                    </div>

                    {!browserSupportsSpeechRecognition && (
                        <p className="text-red-400 text-sm mt-4">
                            🎤 Voice input not supported in this browser.
                        </p>
                    )}
                </div>
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
