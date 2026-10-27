"use client";

import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

// /pricing is public, so this header works signed-in and signed-out.
export default function PricingHeader() {
  return (
    <header className="top">
      <div className="wrap">
        <Link href="/" className="logo" aria-label="MockQube home">
          <Image src="/mockqubelogo.png" alt="" width={26} height={30} priority />
          MockQube
        </Link>
        <nav className="main" aria-label="Main">
          <Link href="/dashboard">Home</Link>
          <Link href="/history">History</Link>
          <Link href="/pricing" className="on">Pricing</Link>
          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <button className="btn">Sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/start-interview" className="btn">Start interview</Link>
            <UserButton />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
