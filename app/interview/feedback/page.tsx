"use client"

import { Suspense } from "react";
import dynamic from 'next/dynamic'

const ClientFeedback = dynamic(
    () => import("./ClientFeedback"),
    { ssr: false }
)

export default function Page() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-300">
                        Loading feedback…
                    </div>
                </main>
            }
        >
            <ClientFeedback />
        </Suspense>)
}