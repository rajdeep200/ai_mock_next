// app/terms-of-service/page.tsx
import React from "react";

import type { Metadata } from "next";
import { META_KEYWORDS } from "@/lib/constant";

const CANONICAL = "https://www.mockqube.com/terms";

export const metadata: Metadata = {
  title: "Terms of Service – MockQube",
  description:
    "MockQube Terms of Service: user responsibilities, acceptable use, subscriptions, and limitations.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    url: CANONICAL,
    title: "Terms of Service – MockQube",
    description:
      "Please review our terms before using MockQube’s services.",
    images: [{ url: "/mockqubelogo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service – MockQube",
    description:
      "The terms that govern your use of MockQube.",
    images: ["/mockqubelogo.png"],
  },
  keywords: META_KEYWORDS
};

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-gray-200">
      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-primary">Terms of Service</h1>
        <p className="text-sm text-gray-400">Effective Date: Sep 11, 2025</p>
        <p className="mt-2 text-xs text-gray-500">These Terms govern your access to and use of MockQube.</p>
      </header>

      {/* Intro */}
      <section className="mb-10">
        <p className="leading-relaxed">
          Welcome to <strong>MockQube</strong> (&quot;MockQube,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
          By creating an account, starting a session, or otherwise using our services (collectively, the &quot;Service&quot;),
          you agree to these Terms of Service (the &quot;Terms&quot;). If you do not agree, do not use the Service.
        </p>
      </section>

      {/* 1. Eligibility */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">1. Eligibility</h2>
        <p>
          You must be at least 18 years old (or the age of majority in your jurisdiction) to use the Service. By using
          the Service, you represent that you have the legal capacity to enter into these Terms.
        </p>
      </section>

      {/* 2. Your Account */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">2. Your Account</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          <li>You are responsible for all activity under your account.</li>
          <li>Keep your login credentials confidential and secure.</li>
          <li>Provide accurate, current information; we may suspend accounts with false or misleading details.</li>
          <li>
            Notify us immediately at{" "}
            <a href="mailto:support@mockqube.com" className="underline text-primary">
              support@mockqube.com
            </a>{" "}
            if you suspect unauthorized access.
          </li>
        </ul>
      </section>

      {/* 3. Plans & Payments */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">3. Plans &amp; Payments</h2>
        <p className="mb-3">
          We offer free and paid subscription plans. When you subscribe to a paid plan, you authorize us (or our payment
          processor) to charge your payment method for the applicable fees.
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          <li>Fees are billed in advance on a recurring basis (monthly or yearly) unless stated otherwise.</li>
          <li>Subscriptions renew automatically unless canceled before the next billing date.</li>
          <li>Prices may change; we will provide reasonable advance notice. Continued use after the effective date
              constitutes acceptance of the new price.</li>
          <li>Taxes may apply based on your location; you are responsible for any applicable taxes.</li>
          <li>
            We may offer trials or promotional credits; if not canceled before trial end, your plan converts to a paid
            subscription at the then-current rate.
          </li>
        </ul>
        <p className="mt-3 text-sm text-gray-400">
          Payments are processed by third parties (e.g., Stripe, Cashfree). We don’t store full card details.
        </p>
      </section>

      {/* 4. Cancellations & Refunds */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">4. Cancellations &amp; Refunds</h2>
        <p>
          You can cancel anytime from your account settings. Cancellation stops future renewals but does not
          automatically entitle you to a refund for past charges. Refund requests are governed by our{" "}
          <a href="/refund-policy" className="underline text-primary">
            Refund &amp; Cancellation Policy
          </a>
          .
        </p>
      </section>

      {/* 5. Acceptable Use */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">5. Acceptable Use</h2>
        <p className="mb-3">You agree not to misuse the Service. Prohibited activities include:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          <li>Violating laws or infringing intellectual property or privacy rights.</li>
          <li>Uploading or sharing harmful, abusive, or discriminatory content.</li>
          <li>Interfering with the Service, spamming, or attempting to gain unauthorized access.</li>
          <li>Reverse engineering, decompiling, scraping, or circumventing technical protections.</li>
          <li>
            Academic integrity: Using the Service to cheat on exams/assessments or submit AI-generated work as your own
            where prohibited.
          </li>
        </ul>
      </section>

      {/* 6. AI-Generated Content */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">6. AI-Generated Content Disclaimer</h2>
        <p>
          The Service uses AI to generate prompts, hints, and feedback. AI output can be incomplete, inaccurate, or
          biased. It is provided for educational practice only and does not constitute professional advice. You are
          responsible for evaluating and verifying any output before relying on it.
        </p>
      </section>

      {/* 7. User Content & License */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">7. Your Content &amp; License to Us</h2>
        <p className="mb-3">
          You retain ownership of code, audio, text, and other content you submit (&quot;User Content&quot;). You grant
          MockQube a worldwide, non-exclusive, royalty-free license to host, process, transmit, display, and create
          non-public analytical derivatives of your User Content solely to operate and improve the Service (e.g.,
          scoring, debugging, model evaluation). We do not sell your User Content.
        </p>
        <p className="text-sm text-gray-400">
          If you provide feedback or suggestions, you grant us a perpetual, irrevocable, royalty-free license to use it
          without restriction.
        </p>
      </section>

      {/* 8. Privacy */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">8. Privacy</h2>
        <p>
          We handle personal information as described in our{" "}
          <a href="/privacy-policy" className="underline text-primary">
            Privacy Policy
          </a>
          . By using the Service, you consent to those practices.
        </p>
      </section>

      {/* 9. Service Availability & Fair Use */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">9. Service Availability &amp; Fair Use</h2>
        <p className="mb-3">
          We strive for reliable, secure operation but do not guarantee uninterrupted or error-free access. Maintenance,
          updates, and outages may occur.
        </p>
        <p>
          To protect the platform, we may apply reasonable rate limits or session caps, and suspend accounts that
          degrade system performance or violate these Terms.
        </p>
      </section>

      {/* 10. Third-Party Services */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">10. Third-Party Services</h2>
        <p>
          The Service may integrate third-party tools (e.g., payment processors, voice/STT/TTS providers). Your use of
          those services may be subject to their terms and privacy policies. We are not responsible for third-party
          services.
        </p>
      </section>

      {/* 11. Intellectual Property */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">11. Intellectual Property</h2>
        <p>
          The Service, including software, models, designs, and branding, is owned by MockQube or its licensors and is
          protected by intellectual property laws. Except for your User Content and rights expressly granted in these
          Terms, no rights are transferred to you.
        </p>
      </section>

      {/* 12. Beta Features */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">12. Beta &amp; Experimental Features</h2>
        <p>
          From time to time, we may offer beta or experimental features. They are provided &quot;as is&quot; and may be
          modified or discontinued at any time.
        </p>
      </section>

      {/* 13. Limitation of Liability */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">13. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, MockQube will not be liable for indirect, incidental, special,
          consequential, or exemplary damages. Our aggregate liability arising out of or relating to the Service will
          not exceed the amounts you paid to MockQube in the twelve (12) months preceding the claim.
        </p>
      </section>

      {/* 14. Indemnification */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">14. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless MockQube and its affiliates from any claims, liabilities,
          damages, losses, and expenses (including reasonable legal fees) arising out of or related to your use of the
          Service or violation of these Terms.
        </p>
      </section>

      {/* 15. Termination */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">15. Suspension &amp; Termination</h2>
        <p>
          We may suspend or terminate access to the Service at any time if we believe you have violated these Terms or
          present a risk to others or to the platform. You may stop using the Service at any time by canceling your
          plan.
        </p>
      </section>

      {/* 16. Governing Law & Disputes */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">16. Governing Law &amp; Disputes</h2>
        <p>
          These Terms are governed by the laws of <strong>[Set Your Governing Law]</strong>, without regard to conflict
          of laws rules. Disputes will be resolved exclusively in the courts located in{" "}
          <strong>[Set Your Venue/Jurisdiction]</strong>. You and MockQube consent to personal jurisdiction there.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Tip: If you’re India-based, consider &quot;India, with venue in Kolkata, West Bengal.&quot; Update the bracketed
          placeholders before publishing.
        </p>
      </section>

      {/* 17. Changes to These Terms */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">17. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. For material changes, we will provide reasonable notice via
          email or in-app messaging. Your continued use of the Service after the effective date of the changes
          constitutes acceptance.
        </p>
      </section>

      {/* 18. Contact */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-2">18. Contact Us</h2>
        <p>
          Questions about these Terms? Email{" "}
          <a href="mailto:support@mockqube.com" className="underline text-primary">
            support@mockqube.com
          </a>
          .
        </p>
              <p className="mt-2 text-xs text-gray-500">
          This page is provided for convenience and does not constitute legal advice. Consider consulting counsel to
          tailor these Terms to your business and jurisdiction.
        </p>
      </section>
    </div>
  );
}
