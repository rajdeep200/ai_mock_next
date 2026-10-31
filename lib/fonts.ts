// Self-hosted variable fonts (latin subset, SIL Open Font License). They used to load through
// next/font/google, but Google Fonts sometimes answers with extension-less font URLs that crash
// Next 15's font loader and fail the build, so the files now live in app/fonts.
import localFont from "next/font/local";

export const bricolage = localFont({
  src: "../app/fonts/bricolage-grotesque-latin.woff2",
  weight: "300 700",
  variable: "--font-bricolage",
  display: "swap",
});

export const figtree = localFont({
  src: "../app/fonts/figtree-latin.woff2",
  weight: "400 600",
  variable: "--font-figtree",
  display: "swap",
});

export const geistSans = localFont({
  src: "../app/fonts/geist-latin.woff2",
  weight: "100 900",
  variable: "--font-geist-sans",
  display: "swap",
});

export const geistMono = localFont({
  src: "../app/fonts/geist-mono-latin.woff2",
  weight: "100 900",
  variable: "--font-geist-mono",
  display: "swap",
});
