"use client";

import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

type Active = "about" | "contact" | null;

// Header for the public information pages (About, Contact, legal).
export default function SiteHeader({ active = null }: { active?: Active }) {
  const on = (k: Exclude<Active, null>) => (active === k ? "on" : undefined);
  return (
    <header className="top">
      <div className="wrap">
        <Link href="/" className="logo" aria-label="MockQube home">
          <Image src="/mockqubelogo.png" alt="" width={26} height={30} priority />
          MockQube
        </Link>
        <nav className="main" aria-label="Main">
          <Link href="/#how">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about" className={on("about")}>About</Link>
          <Link href="/contact" className={on("contact")}>Contact</Link>
          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <button type="button" className="btn">Sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="btn">Dashboard</Link>
            <UserButton />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
