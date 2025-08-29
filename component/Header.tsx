'use client'

import { useState } from 'react'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs'
import Link from 'next/link'
import { FiLogIn, FiClock, FiMenu, FiX, FiCreditCard } from 'react-icons/fi'

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="relative flex justify-between items-center px-4 sm:px-8 py-4 h-16 border-b border-gray-800 bg-black text-white">
      {/* Brand */}
      <Link href="/" className="text-lg font-bold text-white">
        MockQube
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-4">
        <SignedIn>
          <nav className="flex items-center gap-3">
            <Link
              href="/history"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 text-gray-300"
              aria-label="History"
              title="History"
            >
              <FiClock size={18} />
              <span>History</span>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 text-gray-300"
              aria-label="Pricing"
              title="Pricing"
            >
              <FiCreditCard size={18} />
              <span>Pricing</span>
            </Link>
          </nav>
          <UserButton />
        </SignedIn>

        <SignedOut>
          <SignInButton forceRedirectUrl="/home">
            <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-200">
              <FiLogIn size={18} />
              <span>Sign in</span>
            </button>
          </SignInButton>
        </SignedOut>
      </div>

      {/* Mobile: avatar (if signed in) + hamburger */}
      <div className="md:hidden flex items-center gap-3">
        <SignedIn>
          <UserButton />
        </SignedIn>

        <button
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-300"
        >
          {open ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <>
          {/* Click-away backdrop */}
          <button
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 md:hidden bg-black/40"
          />
          <div
            id="mobile-menu"
            className="absolute right-3 top-16 z-50 w-56 rounded-lg border border-gray-800 bg-gray-900 shadow-xl md:hidden"
          >
            <nav className="p-2">
              <SignedIn>
                <Link
                  href="/history"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 text-gray-200"
                >
                  <FiClock size={18} />
                  <span>History</span>
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 text-gray-200"
                >
                  <FiCreditCard size={18} />
                  <span>Pricing</span>
                </Link>
              </SignedIn>

              <SignedOut>
                <SignInButton forceRedirectUrl="/home" mode="modal">
                  <button
                    onClick={() => setOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 text-gray-200"
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
    </header>
  )
}
