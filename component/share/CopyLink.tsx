"use client";

import { useState } from "react";

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* clipboard blocked: nothing to do */ }
  };

  return (
    <button type="button" className="btn ghost sm" onClick={copy}>
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
