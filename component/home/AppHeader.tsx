"use client";

import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";

type Active = "dashboard" | "history" | "pricing" | null;

// Signed-in header used on /dashboard, /start-interview and other signed-in pages.
export default function AppHeader({ active = "dashboard" }: { active?: Active }) {
  const on = (k: Exclude<Active, null>) => (active === k ? "on" : undefined);
  return (
    <header className="top">
      <div className="wrap">
        <Link href="/" className="logo" aria-label="MockQube home">
          <Image src="/mockqubelogo.png" alt="" width={26} height={30} priority />
          MockQube
        </Link>
        <nav className="main" aria-label="Main">
          <Link href="/dashboard" className={on("dashboard")}>Dashboard</Link>
          <Link href="/history" className={on("history")}>History</Link>
          <Link href="/pricing" className={on("pricing")}>Pricing</Link>
          <Link href="/start-interview" className="btn">Start interview</Link>
          <UserButton />
        </nav>
      </div>
    </header>
  );
}
