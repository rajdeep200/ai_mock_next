// app/refund-policy/page.tsx
"use client"
import React from "react";

export default function RefundPolicy() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-10 text-gray-200">
            {/* Header */}
            <header className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-primary">
                    Refund & Cancellation Policy
                </h1>
                <p className="text-sm text-gray-400">Effective Date: Jan 1, 2025</p>
            </header>

            {/* Intro */}
            <section className="mb-10">
                <p className="leading-relaxed">
                    At <strong>MockQube</strong>, we want our users to have a smooth
                    experience. This Refund & Cancellation Policy explains how cancellations,
                    renewals, and refunds work for our subscription plans: Free, Starter
                    (₹599/month), and Pro (₹999/month).
                </p>
            </section>

            {/* 1. Free Plan */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">1. Free Plan</h2>
                <p>
                    The Free plan is available at no cost. Since no payment is required, there
                    are no cancellations or refunds associated with this plan.
                </p>
            </section>

            {/* 2. Paid Plans */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    2. Paid Plans (Starter & Pro)
                </h2>
                <p className="mb-3">
                    Both Starter (₹599/month) and Pro (₹999/month) are subscription-based
                    plans that renew automatically each billing cycle unless canceled. By
                    subscribing, you agree to recurring billing.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>
                        <strong>Billing cycle:</strong> Monthly, charged in INR (₹).
                    </li>
                    <li>
                        <strong>Auto-renewal:</strong> Your subscription will renew
                        automatically unless canceled before the renewal date.
                    </li>
                    <li>
                        <strong>Payment methods:</strong> Payments are processed securely
                        through our authorized payment partners.
                    </li>
                </ul>
            </section>

            {/* 3. Cancellations */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    3. Cancellations
                </h2>
                <p className="mb-3">
                    You can cancel your subscription at any time from your account settings.
                    Key points to note:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>
                        Cancelling stops future auto-renewals but does not refund past charges.
                    </li>
                    <li>
                        You will continue to have access to your plan features until the end of
                        your current billing cycle.
                    </li>
                    <li>
                        Once canceled, you may downgrade to the Free plan at no cost.
                    </li>
                </ul>
            </section>

            {/* 4. Refunds */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">4. Refunds</h2>
                <p className="mb-3">
                    As our services are digital and subscription-based, we generally follow a{" "}
                    <strong>no-refund policy</strong>. However, refunds may be considered under
                    the following conditions:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>
                        You were charged by mistake (e.g., duplicate payments or technical
                        errors).
                    </li>
                    <li>
                        You experienced critical technical issues that prevented you from
                        accessing the service, and support was unable to resolve them.
                    </li>
                    <li>
                        Refund requests must be submitted within <strong>7 days</strong> of the
                        original charge.
                    </li>
                </ul>
                <p className="mt-3">
                    Refund approvals are at the sole discretion of <strong>MockQube</strong>.
                    If approved, refunds are processed back to your original payment method and
                    may take 5–10 business days to reflect, depending on your bank or payment provider.
                </p>
            </section>

            {/* 5. Trial Periods */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">5. Trial Periods</h2>
                <p>
                    If we offer free trials in the future, they will convert automatically to a
                    paid plan at the end of the trial unless canceled before the trial expires.
                    Once billed, standard cancellation and refund terms apply.
                </p>
            </section>

            {/* 6. Policy Updates */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">
                    6. Policy Updates
                </h2>
                <p>
                    We may update this Refund & Cancellation Policy to reflect changes in our
                    business or legal requirements. Updated versions will be posted on this
                    page with a new effective date.
                </p>
            </section>

            {/* 7. Contact */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-primary mb-2">7. Contact Us</h2>
                <p>
                    For refund or cancellation requests, please contact us at:{" "}
                    <a href="mailto:support@example.com" className="underline text-primary">
                        support@example.com
                    </a>
                </p>
            </section>
        </div>
    );
}
