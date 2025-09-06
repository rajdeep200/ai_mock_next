// app/terms-of-service/page.tsx
"use client"
import React from "react";

export default function TermsOfService() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-10 text-gray-200">
            {/* Header */}
            <header className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-primary">Terms of Service</h1>
                <p className="text-sm text-gray-400">Effective Date: Jan 1, 2025</p>
            </header>

            {/* Intro */}
            <section className="mb-10">
                <p className="leading-relaxed">
                    Welcome to <strong>MockQube</strong> (“we”, “our”, “us”). By creating
                    an account or using our services, you agree to these Terms of Service
                    (“Terms”). Please read them carefully, as they form a legally binding
                    agreement between you and us. If you do not agree, you may not use our
                    services.
                </p>
            </section>

            {/* Sections */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">1. Eligibility</h2>
                <p>
                    You must be at least 18 years old (or the age of majority in your
                    jurisdiction) to use our services. By using our platform, you confirm
                    that you have the legal capacity to enter into this agreement.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">2. Your Account</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>You are responsible for all activities under your account.</li>
                    <li>Keep your login credentials confidential and secure.</li>
                    <li>
                        Provide accurate and updated information when registering. False or
                        misleading details may result in suspension or termination.
                    </li>
                    <li>
                        Notify us immediately at{" "}
                        <a href="mailto:support@example.com" className="underline text-primary">
                            support@example.com
                        </a>{" "}
                        if you suspect unauthorized access to your account.
                    </li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    3. Plans & Payments
                </h2>
                <p className="mb-3">
                    We offer both free and paid subscription plans. When you subscribe to a
                    paid plan:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>Payments are billed in advance (monthly or yearly).</li>
                    <li>
                        Subscriptions renew automatically unless canceled before the next billing
                        cycle.
                    </li>
                    <li>
                        Prices may change, but we will provide notice in advance. Continued use
                        after the change constitutes agreement.
                    </li>
                    <li>
                        Taxes may apply depending on your location. You are responsible for
                        paying any applicable taxes.
                    </li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    4. Cancellations & Refunds
                </h2>
                <p>
                    You may cancel your subscription at any time through your account
                    settings. Cancellation stops future renewals but does not automatically
                    grant refunds for past payments. Refund requests are handled under our{" "}
                    <a href="/refund-policy" className="underline text-primary">
                        Refund & Cancellation Policy
                    </a>
                    .
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    5. Acceptable Use Policy
                </h2>
                <p className="mb-3">
                    You agree not to misuse our platform. Prohibited activities include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>Breaking laws or violating intellectual property rights.</li>
                    <li>Sharing harmful, abusive, or discriminatory content.</li>
                    <li>Spamming, hacking, or attempting to disrupt the service.</li>
                    <li>
                        Reverse engineering, copying, or redistributing our platform without
                        permission.
                    </li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    6. AI-Generated Content Disclaimer
                </h2>
                <p>
                    Our service uses AI to generate interview questions, answers, and feedback.
                    AI outputs may sometimes be incomplete, inaccurate, or biased. They are
                    provided for practice purposes only and must not be treated as professional
                    or certified advice. You are responsible for evaluating the accuracy and
                    usefulness of AI-generated content.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">7. Privacy</h2>
                <p>
                    We respect your privacy and handle your personal information as described
                    in our{" "}
                    <a href="/privacy-policy" className="underline text-primary">
                        Privacy Policy
                    </a>
                    . By using our service, you agree to the collection and use of your
                    information in accordance with that policy.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    8. Service Availability
                </h2>
                <p>
                    We aim to provide a reliable and secure service, but we do not guarantee
                    uninterrupted or error-free operation. Planned maintenance and unforeseen
                    downtime may occur.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    9. Limitation of Liability
                </h2>
                <p>
                    To the fullest extent permitted by law, our total liability for any claim
                    arising out of or related to your use of the service shall not exceed the
                    amount you paid to us in the 12 months before the claim. We are not liable
                    for indirect, incidental, or consequential damages.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">10. Termination</h2>
                <p>
                    We may suspend or terminate your account if you violate these Terms or if
                    your use poses a risk to us or others. You may also stop using the service
                    at any time by canceling your account.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    11. Governing Law & Disputes
                </h2>
                <p>
                    These Terms are governed by the laws of your country of residence. In case
                    of disputes, we will first attempt to resolve them amicably. If not
                    resolved, disputes will be handled in the courts of{" "}
                    <strong>[Your Jurisdiction]</strong>.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    12. Changes to These Terms
                </h2>
                <p>
                    We may update these Terms from time to time. If changes are significant, we
                    will notify you by email or in-app notification before they take effect.
                    Continued use of the service after changes means you accept the new Terms.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">13. Contact Us</h2>
                <p>
                    For questions or concerns about these Terms, contact us at:{" "}
                    <a href="mailto:support@example.com" className="underline text-primary">
                        support@example.com
                    </a>
                </p>
            </section>
        </div>
    );
}
