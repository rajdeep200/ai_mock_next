import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export const dynamic = "force-dynamic";  // prevents static pre-render issues

export default function Page() {
    return (
        <main className="min-h-screen bg-black text-white p-6">
            <h1 className="text-3xl font-semibold text-green-400 mb-4">
                Payment Success
            </h1>
            <Suspense fallback={<p className="text-gray-400">Loading…</p>}>
                <SuccessClient />
            </Suspense>
        </main>
    );
}
