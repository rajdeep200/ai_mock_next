"use client";

import { usePathname } from "next/navigation";

// "/", "/home", "/pricing", "/start-interview", "/interview" and "/interview/feedback" ship their own header/footer, so the global ones are skipped there.
export default function HideOnHome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (["/", "/home", "/dashboard", "/history", "/billing/return", "/pricing", "/start-interview", "/interview", "/interview/feedback", "/about", "/contact", "/terms", "/privacy-policy", "/refund-policy"].includes(pathname) || pathname.startsWith("/sessions/") || pathname.startsWith("/s/") || pathname.startsWith("/invite/")) return null;
  return <>{children}</>;
}
