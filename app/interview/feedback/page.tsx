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
                <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", background: "#F4F0EA", color: "#5C5850", fontWeight: 600 }}>
                    Loading feedback…
                </main>
            }
        >
            <ClientFeedback />
        </Suspense>)
}
