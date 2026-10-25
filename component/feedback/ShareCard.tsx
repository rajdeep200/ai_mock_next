"use client";

import { useMemo, useState } from "react";

type Props = {
  sessionId: string;
  initialEnabled?: boolean;
  initialUrl?: string | null;
  score?: number | null;
};

// Same behaviour as component/ShareInterview.tsx, restyled for the redesigned feedback page.
// (ShareInterview is still used by /sessions/[id], which keeps the older look.)
export default function ShareCard({ sessionId, initialEnabled, initialUrl, score }: Props) {
  const [enabled, setEnabled] = useState(!!initialEnabled);
  const [url, setUrl] = useState<string | null>(initialUrl || null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"link" | "post" | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleShare(on: boolean) {
    setLoading(true);
    setError(null);
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
        setError(data.error || "Failed to update share setting");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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

  // Downloadable image comes from the OG endpoint, keyed by the share slug.
  const downloadHref = useMemo(() => {
    try {
      if (!url) return null;
      const slug = new URL(url).pathname.split("/").pop();
      return slug ? `/api/og/session/${slug}?dl=1` : null;
    } catch {
      return null;
    }
  }, [url]);

  async function downloadImage(e: React.MouseEvent) {
    e.preventDefault();
    if (!downloadHref) return;
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(downloadHref, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const slug = url ? new URL(url).pathname.split("/").pop() : "card";
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `mockqube-share-${slug}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError("Couldn't download the image. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  const copyWithFlash = async (text: string, which: "link" | "post") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1000);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };

  return (
    <section className="card" data-share={enabled && url ? "on" : "off"} aria-labelledby="share-title">
      <div className="share-h">
        <div>
          <h3 id="share-title">Share your <b>success</b></h3>
          <p>Generate a public link with a preview card for LinkedIn.</p>
        </div>
        <button
          type="button"
          className="switch"
          role="switch"
          aria-checked={enabled}
          aria-label="Public share link"
          disabled={loading}
          onClick={() => toggleShare(!enabled)}
        />
      </div>

      {error && <p className="share-err" role="alert">{error}</p>}

      {enabled && url && (
        <div className="share-body">
          <div className="og" aria-hidden="true">
            <span className="thumb" data-score={score != null ? `${score}%` : undefined} />
            <p><b>This is how your post will look</b>A preview card with your preparation score.</p>
          </div>

          <div>
            <span className="lbl">Public link</span>
            <div className="urlrow">
              <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Public link" />
              <button
                type="button"
                className={`btn dark${copied === "link" ? " copied" : ""}`}
                onClick={() => copyWithFlash(url, "link")}
              >
                {copied === "link" ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>

          <div className="actions">
            <a href={url} target="_blank" rel="noopener noreferrer" className="btn ghost sm">View page</a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn in sm"
            >
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" /></svg>
              Share on LinkedIn
            </a>
          </div>

          <div>
            <label className="lbl" htmlFor="post-text">LinkedIn post text</label>
            <textarea
              id="post-text"
              className="post"
              readOnly
              value={postText}
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="actions" style={{ marginTop: 10 }}>
              <button
                type="button"
                className={`btn ghost sm${copied === "post" ? " copied" : ""}`}
                onClick={() => copyWithFlash(postText, "post")}
              >
                {copied === "post" ? "Copied" : "Copy post text"}
              </button>
              {downloadHref && (
                <a href={downloadHref} onClick={downloadImage} className="btn ghost sm">
                  {downloading ? "Downloading…" : "Download image"}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
