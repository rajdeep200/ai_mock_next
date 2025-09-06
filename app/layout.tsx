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
  title: "MockQube.com",
  description:
    "MockQube is an AI-powered platform for DSA mock interviews. Practice algorithm problems in a modular cube format, get real-time feedback, and boost your coding confidence.",
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
