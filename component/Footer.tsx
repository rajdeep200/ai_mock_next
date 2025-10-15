// component/Footer.tsx
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative border-t border-gray-800/80 bg-black/70 text-gray-300 backdrop-blur">
      {/* BG */}
      <div aria-hidden className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(800px_200px_at_50%_120%,rgba(34,197,94,.15),transparent_70%)]" />
        <div className="absolute inset-0 [mask-image:linear-gradient(to_top,black,transparent)] opacity-40">
          <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.5)_1px,transparent_1px)] bg-[size:42px_42px]" />
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
            <div className="flex items-center gap-2">
              <span className="relative inline-flex h-9 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-gray-900/60 shadow-[0_0_16px_rgba(16,185,129,.25)] ring-1 ring-emerald-500/20">
                <Image
                  src="/mockqubelogo.png"
                  alt="MockQube logo"
                  width={22}
                  height={20}
                  className="opacity-95"
                />
              </span>
              <span className="text-lg font-extrabold bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                MockQube
              </span>
            </div>
            <p className="text-sm text-gray-400 max-w-sm">
              AI-powered DSA mock interviews & actionable feedback.
            </p>
          </div>

          {/* Nav */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            {/* [SEO-IL] ensure homepage link exists everywhere */}
            <FooterLink href="/" rel="home">Home</FooterLink>
            {/* [SEO-IL] key journeys */}
            {/* <FooterLink href="/start-interview">Start Interview</FooterLink> */}
            <FooterLink href="/pricing">Pricing</FooterLink>
            <FooterLink href="/about">About Us</FooterLink>
            {/* <FooterLink href="/blog">Blog</FooterLink> */}
            {/* [SEO-IL] fix slugs to match your actual pages */}
            <FooterLink href="/terms-of-service">Terms of Service</FooterLink>
            <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
            {/* Keep if you have a page */}
            <FooterLink href="/contact">Contact</FooterLink>
          </nav>
        </div>

        <div className="mt-8 text-xs text-gray-500 text-center md:text-left">
          © {new Date().getFullYear()} <span className="text-gray-300">MockQube</span>. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
  rel,
}: {
  href: string;
  children: React.ReactNode;
  rel?: string;
}) {
  return (
    <Link
      href={href}
      rel={rel}
      className="relative text-gray-400 hover:text-white transition group"
    >
      {children}
      <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-emerald-400 transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}
