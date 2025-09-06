// app/privacy/page.tsx
"use client"
import React from "react";

export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-10 text-gray-200">
            {/* Header */}
            <header className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-primary">Privacy Policy</h1>
                <p className="text-sm text-gray-400">Effective Date: Jan 1, 2025</p>
            </header>

            {/* Intro */}
            <section className="mb-10">
                <p className="leading-relaxed">
                    Your privacy is important to us. This Privacy Policy explains how{" "}
                    <strong>MockQube</strong> (“we”, “our”, “us”) collects, uses, shares,
                    and protects your information when you use our services, including our Free,
                    Starter (₹499/month), and Pro (₹999/month) plans.
                </p>
            </section>

            {/* 1. Information We Collect */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    1. Information We Collect
                </h2>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>
                        <strong>Account Information:</strong> Name, email address, password, and
                        payment details for paid plans.
                    </li>
                    <li>
                        <strong>Usage Data:</strong> Log data such as IP address, device type,
                        browser, and pages visited.
                    </li>
                    <li>
                        <strong>Interview Data:</strong> Text, audio, or code you provide during
                        mock interviews (used only for providing and improving the service).
                    </li>
                    <li>
                        <strong>Cookies:</strong> Small files stored on your device to remember
                        preferences and improve functionality.
                    </li>
                </ul>
            </section>

            {/* 2. How We Use Your Data */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    2. How We Use Your Data
                </h2>
                <p className="mb-3">We use your information to:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>Provide and improve our services.</li>
                    <li>Process payments and manage subscriptions.</li>
                    <li>Communicate with you (support, updates, billing notices).</li>
                    <li>Maintain security and prevent fraud or abuse.</li>
                    <li>Analyze anonymized data to improve features and performance.</li>
                </ul>
            </section>

            {/* 3. AI Data Processing */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    3. AI Data Processing
                </h2>
                <p>
                    Our service generates interview questions and feedback using AI. Data you
                    provide during interviews may be processed by AI systems to deliver results.
                    We do not sell your personal data or share your interview content with
                    advertisers.
                </p>
            </section>

            {/* 4. Sharing Your Data */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    4. Sharing Your Data
                </h2>
                <p className="mb-3">
                    We share your information only when necessary, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>
                        <strong>Payment Providers:</strong> To process subscription payments.
                    </li>
                    <li>
                        <strong>Service Providers:</strong> For hosting, analytics, and customer
                        support.
                    </li>
                    <li>
                        <strong>Legal Obligations:</strong> When required by law or to enforce our
                        Terms of Service.
                    </li>
                </ul>
            </section>

            {/* 5. Data Storage & Security */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    5. Data Storage & Security
                </h2>
                <p>
                    We store your data securely on trusted cloud providers. We use encryption,
                    access controls, and monitoring to protect your information. However, no
                    system is 100% secure, and we cannot guarantee absolute security.
                </p>
            </section>

            {/* 6. Your Rights */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">6. Your Rights</h2>
                <p className="mb-3">Depending on your location, you may have rights to:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>Access the data we hold about you.</li>
                    <li>Request corrections to inaccurate information.</li>
                    <li>Request deletion of your data (subject to legal obligations).</li>
                    <li>Opt-out of marketing communications.</li>
                </ul>
                <p className="mt-3">
                    To exercise your rights, contact us at{" "}
                    <a href="mailto:support@example.com" className="underline text-primary">
                        support@example.com
                    </a>
                    .
                </p>
            </section>

            {/* 7. Data Retention */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    7. Data Retention
                </h2>
                <p>
                    We retain personal data for as long as your account is active or as needed
                    to provide services. Certain data may be retained longer if required by law
                    or to resolve disputes.
                </p>
            </section>

            {/* 8. International Users */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    8. International Users
                </h2>
                <p>
                    If you access our services from outside India, note that your data will be
                    transferred to and processed in India (or other regions where our providers
                    operate). By using our services, you consent to this transfer.
                </p>
            </section>

            {/* 9. Changes to This Policy */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    9. Changes to This Policy
                </h2>
                <p>
                    We may update this Privacy Policy to reflect changes in our practices or
                    for legal reasons. If we make significant changes, we will notify you via
                    email or in-app notifications.
                </p>
            </section>

            {/* 10. Contact */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">10. Contact Us</h2>
                <p>
                    For questions or concerns about this Privacy Policy, contact us at:{" "}
                    <a href="mailto:support@example.com" className="underline text-primary">
                        support@example.com
                    </a>
                </p>
            </section>
        </div>
    );
}
