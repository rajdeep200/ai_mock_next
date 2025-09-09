// components/ShareInterview.tsx
"use client";
import { useMemo, useState } from "react";

export function ShareInterview({
    sessionId,
    initialEnabled,
    initialUrl,
}: {
    sessionId: string;
    initialEnabled?: boolean;
    initialUrl?: string | null;
}) {
    const [enabled, setEnabled] = useState(!!initialEnabled);
    const [url, setUrl] = useState<string | null>(initialUrl || null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState<"link" | "post" | null>(null);
    const [downloading, setDownloading] = useState(false);

    async function toggleShare(on: boolean) {
        setLoading(true);
        try {
            const res = await fetch(`/api/sessions/${sessionId}/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enable: on }),
            });
            const data = await res.json();
            if (res.ok) {
                setEnabled(on);
                setUrl(data.shareUrl ?? null);
            } else {
                alert(data.error || "Failed to update share setting");
            }
        } finally {
            setLoading(false);
        }
    }

    // Build LinkedIn post text (generic + safe)
    const postText = useMemo(() => {
        const link = url ?? "";
        return [
            "I just completed a mock interview on MockQube 🚀",
            "Feeling more prepared and ready for the next challenge.",
            "",
            `Read my AI feedback here: ${link}`,
            "",
            "#MockInterview #InterviewPrep #DSA #CareerGrowth #MockQube",
        ].join("\n");
    }, [url]);

    // Derive a downloadable image link from the share URL (your OG endpoint)
    const downloadHref = useMemo(() => {
        try {
            if (!url) return null;
            const u = new URL(url);
            const slug = u.pathname.split("/").pop();
            return slug ? `/api/og/session/${slug}?dl=1` : null;
        } catch {
            return null;
        }
    }, [url]);

    async function downloadImage() {
        if(!downloadHref) return 
        setDownloading(true)

        try {
            const res = await fetch(downloadHref, {cache: "no-store"})
            if(!res.ok) throw new Error(`HTTP ${res.status}`)

            const blob = await res.blob()
            const objectUrl =  URL.createObjectURL(blob)

            const a = document.createElement('a')
            const slug = url ? new URL(url).pathname.split("/").pop() : "card";
            a.href = objectUrl
            a.download = `mockqube-share-${slug}.png`;
            document.body.appendChild(a)

            a.click()
            a.remove()
            URL.revokeObjectURL(objectUrl)
        } catch (error) {
            alert("Couldn't download image. Please try again.")
            console.log('IMAGE DOWNLOAD ERROR :: ', error)
        } finally{
            setDownloading(false)
        }
    }

    const copyWithFlash = async (text: string, which: "link" | "post") => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(which);
            setTimeout(() => setCopied(null), 1000);
        } catch {
            // swallow
        }
    };

    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 sm:p-5">
            {/* Header row: title + toggle (wraps nicely on small screens) */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-200">Share your success</h3>
                    <p className="text-sm text-gray-400">
                        Generate a public link with a nice preview card for LinkedIn.
                    </p>
                </div>
                <button
                    onClick={() => toggleShare(!enabled)}
                    disabled={loading}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition w-full sm:w-auto
            ${enabled
                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20 hover:bg-emerald-500/15"
                            : "border border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-600"
                        } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                    {enabled ? (loading ? "Disabling…" : "Disable") : loading ? "Enabling…" : "Enable"}
                </button>
            </div>

            {enabled && url && (
                <>
                    {/* URL row — fully responsive */}
                    <div className="mt-4 flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 items-center gap-2">
                            <input
                                readOnly
                                value={url}
                                onFocus={(e) => e.currentTarget.select()}
                                className="w-full min-w-0 flex-1 truncate rounded-lg border border-gray-700 bg-black/50 px-3 py-2 text-sm text-gray-200"
                            />
                        </div>
                        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:flex-none">
                            <button
                                onClick={() => copyWithFlash(url, "link")}
                                className="cursor-pointer rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 hover:border-gray-600 w-full sm:w-auto"
                            >
                                {copied === "link" ? "Copied" : "Copy Link"}
                            </button>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-center text-sm text-gray-200 hover:border-gray-600 w-full sm:w-auto"
                            >
                                View
                            </a>
                            <a
                                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                                    url
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="col-span-2 sm:col-span-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/20 hover:bg-emerald-500/15 w-full sm:w-auto"
                            >
                                Share on LinkedIn
                            </a>
                        </div>
                    </div>

                    {/* Post text + download image */}
                    <div className="mt-4">
                        <label className="mb-1 block text-xs text-gray-400">LinkedIn post text</label>
                        <textarea
                            readOnly
                            rows={4}
                            value={postText}
                            onFocus={(e) => e.currentTarget.select()}
                            className="w-full rounded-lg border border-gray-700 bg-black/50 px-3 py-2 text-sm text-gray-200"
                        />
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                            <button
                                onClick={() => copyWithFlash(postText, "post")}
                                className="cursor-pointer rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 hover:border-gray-600 w-full sm:w-auto"
                            >
                                {copied === "post" ? "Copied" : "Copy Post Text"}
                            </button>

                            {downloadHref && (
                                <a
                                    href={downloadHref}
                                    onClick={downloadImage}
                                    // download={`mockqube-share-${(url ? new URL(url).pathname.split("/").pop() : "card")}.png`}
                                    // target="_blank"
                                    // rel="noopener noreferrer"
                                    className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-center text-sm text-gray-200 hover:border-gray-600 w-full sm:w-auto"
                                >
                                    { downloading ?  'Downloading...' : 'Download Image' }
                                </a>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
