// app/api/og/session/[slug]/route.ts
// The image shown when a shared interview link is posted (and what "Download image" saves).
// Satori supports only a subset of CSS: every element with several children needs display:flex,
// and the score ring is an inline SVG image rather than a conic-gradient.
import React from "react";
import { ImageResponse } from "next/og";
import { READY_PERCENT } from "@/lib/dashboard";

export const runtime = "edge"; // allowed on API routes

// Use module constants instead of exporting "size"
const WIDTH = 1200;
const HEIGHT = 630;

const INK = "#16150F";
const INK_2 = "#5C5850";
const LINE = "#E3DDD3";
const OK = "#1F8F5F";
const SUN = "#FFB43A";
const BLUSH = "#FF8F6B";
const COBALT = "#2B3AF0";

const h = React.createElement;

function originFromReq(req: Request) {
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
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

function chip(text: string, key: string) {
  return h(
    "div",
    {
      key,
      style: {
        display: "flex",
        alignItems: "center",
        padding: "8px 22px",
        borderRadius: 999,
        background: "#FFFFFF",
        border: `1px solid ${LINE}`,
        fontSize: 24,
        fontWeight: 600,
        color: INK,
      },
    },
    text
  );
}

// Score ring as an SVG data URI: a white track and a coloured arc for the percentage
function ringSrc(percent: number, color: string) {
  const r = 120;
  const c = 2 * Math.PI * r;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">` +
    `<circle cx="150" cy="150" r="${r}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="30"/>` +
    `<circle cx="150" cy="150" r="${r}" fill="none" stroke="#EFE9DF" stroke-width="30"/>` +
    `<circle cx="150" cy="150" r="${r}" fill="none" stroke="${color}" stroke-width="30" stroke-linecap="round" ` +
    `stroke-dasharray="${(c * percent) / 100} ${c}" transform="rotate(-90 150 150)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
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

  const techRaw = data?.technology ?? "";
  const tech = techRaw.toLowerCase() === "dsa" ? "DSA" : techRaw;
  const level = data?.level ? data.level.charAt(0).toUpperCase() + data.level.slice(1) : null;
  const company = data?.company || null;
  const percent =
    typeof data?.modelPreparationPercent === "number" ? data.modelPreparationPercent : null;

  const color = percent === null ? COBALT : percent >= READY_PERCENT ? OK : percent >= 50 ? SUN : BLUSH;
  const note = percent === null ? "" : percent >= READY_PERCENT ? "Interview-ready" : percent >= 50 ? "Getting there" : "Needs practice";

  const subtitle = [tech ? `${tech} mock interview` : "Mock interview", level, company].filter(Boolean).join(" · ");
  const chips = [
    data?.duration != null ? chip(`${data.duration} min`, "d") : null,
    note ? chip(note, "n") : null,
  ].filter(Boolean);

  // soft sun-to-cobalt disc in the corner, like the site's pages
  const disc = h("div", {
    style: {
      position: "absolute",
      right: -150,
      top: -230,
      width: 760,
      height: 760,
      borderRadius: 380,
      opacity: 0.22,
      background: "linear-gradient(150deg, #FFC24D 0%, #FF8F6B 38%, #7A5CFF 78%, #2B3AF0 100%)",
    },
  });

  const brand = h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 14 } },
    h("div", { style: { width: 22, height: 22, borderRadius: 11, background: COBALT } }),
    h("div", { style: { fontSize: 36, fontWeight: 800, color: INK } }, "MockQube")
  );

  const left = h(
    "div",
    { style: { display: "flex", flexDirection: "column", flex: 1, paddingRight: 40 } },
    h("div", { style: { fontSize: 28, fontWeight: 600, color: INK_2 } }, subtitle),
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          marginTop: 14,
          fontSize: 92,
          fontWeight: 800,
          lineHeight: 1.02,
          letterSpacing: -3,
          color: INK,
        },
      },
      percent === null
        ? [h("div", { key: "a" }, "Mock interview"), h("div", { key: "b" }, "completed")]
        : [h("div", { key: "a" }, "Preparation"), h("div", { key: "b", style: { color: INK_2 } }, "score")]
    ),
    chips.length
      ? h("div", { style: { display: "flex", gap: 14, marginTop: 34 } }, chips as React.ReactElement[])
      : null
  );

  const ring =
    percent === null
      ? null
      : h(
          "div",
          { style: { display: "flex", position: "relative", width: 300, height: 300 } },
          h("img", { src: ringSrc(percent, color), width: 300, height: 300, style: { position: "absolute", left: 0, top: 0 } }),
          h(
            "div",
            {
              style: {
                position: "absolute",
                left: 0,
                top: 0,
                width: 300,
                height: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
            },
            h("div", { style: { fontSize: 104, fontWeight: 800, color: INK, letterSpacing: -4 } }, `${percent}%`)
          )
        );

  const tree = h(
    "div",
    {
      style: {
        height: "100%",
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: "linear-gradient(100deg, #FBF9F6, #F4F0EA)",
        color: INK,
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      },
    },
    disc,
    brand,
    h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, left, ring),
    h("div", { style: { display: "flex", fontSize: 26, fontWeight: 600, color: INK_2 } }, "Practise your own AI mock interview at mockqube.com")
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
