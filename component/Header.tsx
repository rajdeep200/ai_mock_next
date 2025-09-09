// components/Header.tsx
"use client";

import { useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { FiLogIn, FiClock, FiMenu, FiX, FiCreditCard } from "react-icons/fi";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Futuristic bar background */}
      <div className="relative">
        {/* Neon gradient & grid */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(1200px_200px_at_50%_-40%,rgba(34,197,94,.18),transparent_60%)]" />
          <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-40">
            <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.6)_1px,transparent_1px)] bg-[size:42px_42px]" />
          </div>
        </div>

        {/* Content row */}
        <div className="relative flex h-16 items-center justify-between px-4 sm:px-8 border-b border-gray-800/80 backdrop-blur bg-black/65">
          {/* Brand */}
          <Link href="/" className="group flex items-center gap-2">
            <span className="relative inline-flex h-8 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-gray-900/60 shadow-[0_0_20px_rgba(16,185,129,.25)] ring-1 ring-emerald-500/20">
              <Image
                src="/mockqubelogo.png"
                alt="MockQube logo"
                width={20}
                height={18}
                className="opacity-95"
                priority
              />
            </span>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent">
              MockQube
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <SignedIn>
              <nav className="flex items-center gap-2">
                <NavLink href="/history" icon={<FiClock size={18} />}>
                  History
                </NavLink>
                <NavLink href="/pricing" icon={<FiCreditCard size={18} />}>
                  Pricing
                </NavLink>
              </nav>
              <div className="ml-2">
                <UserButton />
              </div>
            </SignedIn>

            <SignedOut>
              <SignInButton forceRedirectUrl="/home">
                <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-700/80 bg-gray-900/60 text-gray-200 hover:border-emerald-600/60 hover:text-white hover:shadow-[0_0_24px_rgba(16,185,129,.15)] transition">
                  <FiLogIn size={18} />
                  <span>Sign in</span>
                </button>
              </SignInButton>
            </SignedOut>
          </div>

          {/* Mobile: avatar + hamburger */}
          <div className="md:hidden flex items-center gap-3">
            <SignedIn>
              <UserButton />
            </SignedIn>
            <button
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className="p-2 rounded-xl text-gray-300 hover:bg-gray-800/80 border border-gray-800/80 transition"
            >
              {open ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <>
            {/* Click-away backdrop */}
            <button
              aria-hidden
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 md:hidden bg-black/50 backdrop-blur-sm"
            />
            <div
              id="mobile-menu"
              className="absolute right-3 top-20 z-50 w-[88%] max-w-72 rounded-2xl border border-emerald-700/30 bg-gray-950/90 backdrop-blur shadow-[0_20px_60px_rgba(16,185,129,.18)] md:hidden"
            >
              <nav className="p-2">
                <SignedIn>
                  <MobileItem href="/history" onClick={() => setOpen(false)} icon={<FiClock size={18} />}>
                    History
                  </MobileItem>
                  <MobileItem href="/pricing" onClick={() => setOpen(false)} icon={<FiCreditCard size={18} />}>
                    Pricing
                  </MobileItem>
                </SignedIn>

                <SignedOut>
                  <SignInButton forceRedirectUrl="/home" mode="modal">
                    <button
                      onClick={() => setOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-800/80 bg-gray-900/70 text-gray-200 hover:border-emerald-600/50 hover:text-white transition"
                    >
                      <FiLogIn size={18} />
                      <span>Sign in</span>
                    </button>
                  </SignInButton>
                </SignedOut>
              </nav>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

/* --- Small presentational helpers --- */

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-transparent text-gray-300 hover:text-white hover:border-emerald-600/50 hover:bg-gray-900/60 transition shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_0_24px_rgba(16,185,129,.15)]"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

function MobileItem({
  href,
  onClick,
  icon,
  children,
}: {
  href: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-900/70 text-gray-200 border border-transparent hover:border-emerald-600/40 transition"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
