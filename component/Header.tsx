'use client'

import {
    SignedIn,
    SignedOut,
    SignInButton,
    UserButton,
} from '@clerk/nextjs'
import Link from 'next/link'
import { FiLogIn } from "react-icons/fi";

export default function Header() {
    return (
        <header className="flex justify-between items-center px-4 sm:px-8 py-4 h-16 border-b border-gray-800 bg-black text-white">
            <Link href="/" className="text-lg font-bold text-white">
                MockQube
            </Link>
            <div className="flex items-center gap-4">
                <SignedOut>
                    <SignInButton forceRedirectUrl="/home">
                        <FiLogIn />
                    </SignInButton>
                </SignedOut>
                <SignedIn>
                    <UserButton />
                </SignedIn>
            </div>
        </header>
    )
}
