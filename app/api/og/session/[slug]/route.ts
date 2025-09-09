// app/api/og/session/[slug]/route.ts
import React from "react";
import { ImageResponse } from "next/og";

export const runtime = "edge"; // allowed on API routes

// Use module constants instead of exporting "size"
const WIDTH = 1200;
const HEIGHT = 630;

function originFromReq(req: Request) {
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

function badge(text: string) {
  return React.createElement(
    "div",
    {
      style: {
        display: "flex", // Satori supports: flex | block | none | -webkit-box
        alignItems: "center",
        borderRadius: 999,
        padding: "6px 14px",
        fontSize: 22,
        fontWeight: 700,
        border: "1px solid rgba(16,185,129,.35)",
        background: "rgba(16,185,129,.10)",
        color: "#a7f3d0",
      },
    },
    text
  );
}

async function fetchWithTimeout(
  url: string,
  ms = 1500
): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      cache: "no-store",
      signal: ctrl.signal,
      headers: { accept: "application/json" },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> } // Next 15: params is a Promise
) {
  const { slug } = await ctx.params;
  const origin = originFromReq(req);

  // Fetch public JSON (optional)
  let data: {
    technology: string | null;
    level: string | null;
    duration: number | null;
    modelPreparationPercent: number | null;
    updatedAt: string | null;
    company?: string | null;
    displayName?: string | null;
  } | null = null;

  try {
    const res = await fetchWithTimeout(
      `${origin}/api/share-public/${slug}`,
      1500
    );
    if (res && res.ok) {
      const json = await res.json();
      if (json?.ok) data = json.data;
    }
  } catch {}

  const tech = data?.technology?.toLocaleUpperCase() || "Mock Interview";
  const level = data?.level || "—";
  const duration = data?.duration != null ? `${data.duration}m` : "—";
  const prep =
    typeof data?.modelPreparationPercent === "number"
      ? `${data.modelPreparationPercent}%`
      : "—";
  const company = data?.company || null;

  // simple date formatting (avoid ICU quirks)
  const dateStr = (() => {
    if (!data?.updatedAt) return null;
    const d = new Date(data.updatedAt);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  })();

  const displayName = data?.displayName || "MockQube Candidate";
  const initials =
    displayName
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "MC";

  // Backgrounds
  const bgGlow = React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(900px 280px at 50% 120%, rgba(34,197,94,.22), transparent 70%)",
    },
  });

  const grid = React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      opacity: 0.22,
      background:
        "linear-gradient(to right, rgba(31,41,55,.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(31,41,55,.45) 1px, transparent 1px)",
      backgroundSize: "48px 48px",
    },
  });

  // Top row
  const avatar = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 96,
        width: 96,
        borderRadius: 16,
        border: "1px solid rgba(16,185,129,.35)",
        background: "rgba(2,6,23,.7)",
        boxShadow: "0 0 28px rgba(16,185,129,.18)",
        color: "#a7f3d0",
        fontWeight: 800,
        fontSize: 36,
      },
    },
    initials
  );

  const nameEl = React.createElement(
    "div",
    { style: { fontSize: 34, fontWeight: 800, color: "#e5e7eb" } },
    displayName
  );

  const titleEl = React.createElement(
    "div",
    {
      style: {
        fontSize: 54,
        fontWeight: 900,
        letterSpacing: -0.5,
        marginTop: 8,
        color: "#e5e7eb",
      },
    },
    tech
  );

  const subtitleParts = [
    company ? `@ ${company}` : null,
    dateStr || null,
  ].filter(Boolean);
  const subtitle = React.createElement(
    "div",
    { style: { fontSize: 26, color: "#a7f3d0", marginTop: 4, minHeight: 32 } },
    subtitleParts.join(" • ")
  );

  const badgesRow = React.createElement(
    "div",
    { style: { display: "flex", gap: 16, flexWrap: "wrap", marginTop: 22 } },
    [
      badge(`Level: ${level}`),
      badge(`Duration: ${duration}`),
      badge(`Prepared: ${prep}`),
    ]
  );

  const footerBrand = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 22,
        color: "#9ca3af",
        marginTop: 40,
      },
    },
    [
      React.createElement(
        "div",
        { key: "tag" },
        "AI-powered mock interviews & feedback"
      ),
      React.createElement(
        "div",
        { key: "brand", style: { fontWeight: 800, color: "#a7f3d0" } },
        "MockQube"
      ),
    ]
  );

  // Card (multiple children => must declare display:flex for Satori)
  const card = React.createElement(
    "div",
    {
      style: {
        position: "relative",
        width: 1040,
        borderRadius: 24,
        padding: "40px 48px",
        background: "rgba(2,6,23,.75)",
        border: "1px solid rgba(16,185,129,.28)",
        boxShadow: "0 0 60px rgba(16,185,129,.16)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      },
    },
    [
      React.createElement(
        "div",
        {
          key: "top",
          style: { display: "flex", alignItems: "center", gap: 18 },
        },
        [avatar, nameEl]
      ),
      titleEl,
      subtitle,
      badgesRow,
      footerBrand,
    ]
  );

  // Root must be a flex container (already is)
  const tree = React.createElement(
    "div",
    {
      style: {
        height: "100%",
        width: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        color: "#e5e7eb",
        padding: "40px",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      },
    },
    [bgGlow, grid, card]
  );

  const image = new ImageResponse(tree, { width: WIDTH, height: HEIGHT });

  // Optional: force download
  const url = new URL(req.url);
  if (url.searchParams.get("dl") === "1") {
    image.headers.set(
      "Content-Disposition",
      `attachment; filename="mockqube-share-${slug}.png"`
    );
  }

  return image;
}