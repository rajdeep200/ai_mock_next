import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/component/Header";
import RegisterUser from "@/component/RegisterUser";
import Footer from "@/component/Footer"; // ← add this
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MockQube.com | Your 24/7 AI Interviewer",
  description:
    "Ace your coding interviews with MockQube — the AI-powered mock interview partner for students and junior engineers. Practice DSA problems, get instant feedback on your code and communication, and walk into real interviews with confidence.",
  icons: {
    icon: "/mockqubelogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
        >
          {/* Make the whole app a column to pin footer at bottom */}
          <div className="min-h-screen flex flex-col">
            <Header />
            <RegisterUser />

            {/* Page content grows */}
            <main className="flex-1">{children}</main>

            {/* Global footer */}
            <Footer />
          </div>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
