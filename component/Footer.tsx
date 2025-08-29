// component/Footer.tsx
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-gray-800 bg-black text-gray-300">
            <div className="mx-auto max-w-6xl px-4 sm:px-8 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-center md:text-left">
                        <span className="font-bold text-white">MockQube</span>
                        <p className="text-sm text-gray-400">
                            AI-powered DSA mock interviews & actionable feedback.
                        </p>
                    </div>

                    <nav className="flex items-center gap-5">
                        <Link href="/" className="hover:text-white text-sm">Home</Link>
                        <Link href="/pricing" className="hover:text-white text-sm">Pricing</Link>
                        <Link href="/about" className="hover:text-white text-sm">About Us</Link>
                        <Link href="/contact" className="hover:text-white text-sm">Contact</Link>
                    </nav>
                </div>

                <div className="mt-6 text-xs text-gray-500 text-center md:text-left">
                    © {new Date().getFullYear()} MockQube. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
