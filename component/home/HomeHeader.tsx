"use client";

import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function HomeHeader() {
  return (
    <header className="top">
      <div className="wrap">
        <Link href="/" className="logo" aria-label="MockQube home">
          <Image src="/mockqubelogo.png" alt="" width={26} height={30} priority />
          MockQube
        </Link>
        <nav className="main" aria-label="Main">
          <a href="#how">How it works</a>
          <a href="#plans">Pricing</a>
          <Link href="/history">History</Link>
          <a href="#faq">FAQ</a>
          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <button className="btn">Sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="btn">Start session</Link>
            <UserButton />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
