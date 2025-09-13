// app/privacy/page.tsx
import React from "react";
import type { Metadata } from "next";
import { META_KEYWORDS } from "@/lib/constant";

const CANONICAL = "https://www.mockqube.com/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy Policy - MockQube",
  description:
    "Read MockQube's Privacy Policy: how we collect, use, and protect your data while you practice interviews.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    url: CANONICAL,
    title: "Privacy Policy - MockQube",
    description:
      "Information on data collection, usage, retention, and your rights.",
    images: [{ url: "/mockqubelogo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy - MockQube",
    description:
      "Our commitment to your privacy and data protection.",
    images: ["/mockqubelogo.png"],
  },
  keywords: META_KEYWORDS
};

export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-10 text-gray-2 00">
            {/* Header */}
            <header className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-primary">Privacy Policy</h1>
                <p className="text-sm text-gray-400">Effective Date: Sep 11, 2025</p>
                <p className="mt-2 text-xs text-gray-500">
                    This policy explains how MockQube collects, uses, and protects your information. It should be read with our{" "}
                    <a href="/terms-of-service" className="underline text-primary">Terms of Service</a>.
                </p>
            </header>

            {/* Intro */}
            <section className="mb-10">
                <p className="leading-relaxed">
                    <strong>MockQube</strong> (“MockQube,” “we,” “our,” “us”) provides AI-powered mock interview practice for students and junior engineers.
                    This Privacy Policy describes what data we collect, why we collect it, how we use and share it, and the choices you have.
                    It applies to all plans (Free, Starter, Pro) and to our website and app (the “Service”).
                </p>
                <p className="mt-3 text-sm text-gray-400">
                    Data Controller: MockQube. Contact:{" "}
                    <a href="mailto:support@mockqube.com" className="underline text-primary">support@mockqube.com</a>.
                </p>
            </section>

            {/* 1. Information We Collect */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">1. Information We Collect</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>
                        <strong>Account Information:</strong> Name, email, password (hashed), and optional profile details. For paid plans, billing name and limited payment metadata. We do <em>not</em> store full card numbers.
                    </li>
                    <li>
                        <strong>Interview Data:</strong> Code you write, text you enter, audio you speak, transcripts, session notes, scores/feedback, and timing/interaction events to power coaching and progress features.
                    </li>
                    <li>
                        <strong>Usage & Device Data:</strong> IP address, device/browser type, OS, pages/screens viewed, referring URLs, session duration, crash logs, and product analytics events.
                    </li>
                    <li>
                        <strong>Cookies & Similar Tech:</strong> Cookies/local storage to keep you signed in, remember preferences, and measure performance. See our{" "}
                        <a href="/cookie-policy" className="underline text-primary">Cookie Policy</a> (if applicable).
                    </li>
                    <li>
                        <strong>Support Communications:</strong> Messages you send to support, bug reports, or survey responses.
                    </li>
                </ul>
            </section>

            {/* 2. How We Use Your Data (Purposes + Lawful Bases) */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">2. How We Use Your Data</h2>
                <p className="mb-3">We use your information to:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li><strong>Provide the Service:</strong> Authenticate you, run mock interviews (voice + code), compute feedback and scores, and show progress dashboards.</li>
                    <li><strong>Improve & Secure:</strong> Debug, prevent fraud/abuse, test features, optimize latency and accuracy, and maintain reliability.</li>
                    <li><strong>Billing & Account Management:</strong> Process payments, manage subscriptions, send invoices and renewal notices.</li>
                    <li><strong>Communicate:</strong> Product updates, tips, service announcements, and support responses. You can opt out of most non-essential emails.</li>
                    <li><strong>Analytics & Research:</strong> Use aggregated/anonymized data to understand usage and improve performance and content coverage.</li>
                </ul>
                <p className="mt-3 text-sm text-gray-400">
                    Where required (e.g., GDPR), our lawful bases include: performance of a contract (providing the Service),
                    legitimate interests (security, improvement), consent (certain cookies/marketing), and legal obligation (tax/records).
                </p>
            </section>

            {/* 3. AI Data Processing */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">3. AI Data Processing</h2>
                <p>
                    The Service uses AI to generate prompts, evaluate code/communication, and produce feedback.
                    Your Interview Data may be processed by AI models to deliver these features and to improve accuracy and quality over time.
                    We do not sell your personal data or share your interview content with advertisers.
                </p>
            </section>

            {/* 4. Sharing Your Data */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">4. Sharing Your Data</h2>
                <p className="mb-3">We share data only as needed to operate the Service:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li><strong>Payment Processors:</strong> e.g., Stripe/Cashfree to process subscription payments and detect fraud.</li>
                    <li><strong>Cloud & Infrastructure:</strong> Hosting, databases, storage, logging, and security monitoring.</li>
                    <li><strong>Voice/STT/TTS Providers:</strong> To enable low-latency speech features where you opt in.</li>
                    <li><strong>Analytics & Diagnostics:</strong> Product analytics, crash/error reporting, and performance tools.</li>
                    <li><strong>Legal & Safety:</strong> To comply with law, enforce our Terms, or protect rights, safety, and security.</li>
                </ul>
                <p className="mt-3 text-sm text-gray-400">
                    Service providers are bound by confidentiality and data-processing terms and may only process data on our instructions.
                </p>
            </section>

            {/* 5. Data Storage & Security */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">5. Data Storage & Security</h2>
                <p>
                    We use reputable cloud providers, encryption in transit (HTTPS/TLS), and access controls/logging.
                    While we work hard to protect your data, no system is 100% secure.
                </p>
            </section>

            {/* 6. Your Rights & Choices */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">6. Your Rights &amp; Choices</h2>
                <p className="mb-3">Depending on your location, you may have rights to:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>Access a copy of your personal data.</li>
                    <li>Request correction or deletion of inaccurate/outdated data.</li>
                    <li>Object to or restrict certain processing.</li>
                    <li>Port data in a structured, commonly used format.</li>
                    <li>Withdraw consent where processing is based on consent (e.g., certain cookies/marketing).</li>
                </ul>
                <p className="mt-3">
                    To exercise your rights, email{" "}
                    <a href="mailto:support@mockqube.com" className="underline text-primary">support@mockqube.com</a>.
                    We may verify your identity before fulfilling requests. You can also manage some preferences in your account settings.
                </p>
            </section>

            {/* 7. Data Retention */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">7. Data Retention</h2>
                <p>
                    We keep personal data for as long as your account is active and as needed to provide the Service. After account
                    closure, we generally delete or de-identify personal data within a reasonable period, except where retention is
                    required for legal, tax, security, or dispute-resolution purposes. Aggregated/anonymized data may be retained.
                </p>
            </section>

            {/* 8. International Transfers */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">8. International Transfers</h2>
                <p>
                    We may process data in countries other than where you live. Where required, we use appropriate safeguards
                    (e.g., Standard Contractual Clauses) to protect cross-border transfers.
                </p>
            </section>

            {/* 9. Children’s Privacy */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">9. Children’s Privacy</h2>
                <p>
                    The Service is not intended for individuals under the age of 16 (or older, where local law requires).
                    We do not knowingly collect personal data from children. If you believe a child has provided us data, contact us to request deletion.
                </p>
            </section>

            {/* 10. Do Not Track & Marketing */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">10. Do Not Track &amp; Marketing</h2>
                <p>
                    Some browsers offer “Do Not Track” signals; we do not respond to them at this time. You can opt out of non-essential
                    marketing emails via the unsubscribe link. Essential service emails (billing, security, critical notices) will still be sent.
                </p>
            </section>

            {/* 11. Changes to This Policy */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">11. Changes to This Policy</h2>
                <p>
                    We may update this Policy to reflect changes in our practices or for legal reasons. If changes are material,
                    we will notify you via email or in-app notice before they take effect. The “Effective Date” will indicate the latest version.
                </p>
            </section>

            {/* 12. Contact */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">12. Contact Us</h2>
                <p>
                    Questions or requests? Email{" "}
                    <a href="mailto:support@mockqube.com" className="underline text-primary">support@mockqube.com</a>.
                </p>
                <p className="mt-2 text-xs text-gray-500">
                    This page is for general information and is not legal advice. Consider consulting counsel to tailor this Policy to your jurisdiction and data flows.
                </p>
            </section>
        </div>
    );
}
