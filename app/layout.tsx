import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/component/Header";
import RegisterUser from "@/component/RegisterUser";
import Footer from "@/component/Footer";
import { Analytics } from '@vercel/analytics/next';
import { META_KEYWORDS } from "@/lib/constant";

const siteUrl = "https://www.mockqube.com";
const logo = "/mockqubelogo.png";
const ogImage = logo;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MockQube.com | Your 24/7 AI Interviewer",
    template: "%s | MockQube.com",
  },
  description:
    "Ace your coding interviews with MockQube — the AI-powered mock interview partner for students and junior engineers. Practice DSA problems, get instant feedback on your code and communication, and walk into real interviews with confidence.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: "MockQube.com | Your 24/7 AI Interviewer",
    description:
      "Ace your coding interviews with MockQube — the AI-powered mock interview partner for students and junior engineers. Practice DSA problems, get instant feedback on your code and communication, and walk into real interviews with confidence.",
    siteName: "MockQube",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "MockQube" }]
  },
  twitter: {
    card: "summary_large_image",
    site: "@mockqube",
    creator: "@mockqube",
    title: "MockQube.com | Your 24/7 AI Interviewer",
    description:
      "Practice tech interviews with AI: coding/DSA, system design, behavioral.",
    images: [ogImage],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: logo,
  },
  applicationName: "MockQube",
  keywords: META_KEYWORDS
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
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "MockQube",
                url: siteUrl,
                logo: `${siteUrl}${logo}`,
                sameAs: [
                  "https://x.com/mockqube",
                  "https://www.linkedin.com/company/mockqube",
                  "https://github.com/mockqube"
                ]
              })
            }}
          />
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "MockQube",
                applicationCategory: "EducationalApplication",
                operatingSystem: "Web",
                url: siteUrl,
                image: `${siteUrl}${logo}`,
                offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                description:
                  "Ace your coding interviews with MockQube — the AI-powered mock interview partner for students and junior engineers."
              })
            }}
          />


        </body>
      </html>
    </ClerkProvider>
  );
}
