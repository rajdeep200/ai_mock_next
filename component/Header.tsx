'use client'

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs'
import Link from 'next/link'
import { FiLogIn, FiClock } from "react-icons/fi"

export default function Header() {
  return (
    <header className="flex justify-between items-center px-4 sm:px-8 py-4 h-16 border-b border-gray-800 bg-black text-white">
      <Link href="/" className="text-lg font-bold text-white">
        MockQube
      </Link>

      <div className="flex items-center gap-3">
        <SignedOut>
          <SignInButton forceRedirectUrl="/home">
            <FiLogIn />
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <Link
            href="/history"
            aria-label="History"
            title="History"
            className="p-1 rounded-lg hover:bg-gray-800 text-gray-300 border-2 border-gray-600"
          >
            <FiClock size={20} />
          </Link>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  )
}
