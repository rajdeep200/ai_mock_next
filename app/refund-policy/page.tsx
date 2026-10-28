// app/refund-policy/page.tsx
import React from "react";
import LegalLayout from "@/component/site/LegalLayout";

export default function RefundPolicy() {
    return (
        <LegalLayout
      title="Refund & Cancellation Policy"
      effective="Jan 1, 2025"
      related={[{"href":"/terms","label":"Terms of Service"},{"href":"/contact","label":"Contact us"}]}
    >

            {/* Intro */}
            <div className="intro">
                <p>
                    At <strong>MockQube</strong>, we want our users to have a smooth
                    experience. This Refund & Cancellation Policy explains how cancellations,
                    renewals, and refunds work for our subscription plans: Free, Starter
                    (₹599/month), and Pro (₹999/month).
                </p>
            </div>

            {/* 1. Free Plan */}
            <section>
                <h2>1. Free Plan</h2>
                <p>
                    The Free plan is available at no cost. Since no payment is required, there
                    are no cancellations or refunds associated with this plan.
                </p>
            </section>

            {/* 2. Paid Plans */}
            <section>
                <h2>
                    2. Paid Plans (Starter & Pro)
                </h2>
                <p>
                    Both Starter (₹599/month) and Pro (₹999/month) are subscription-based
                    plans that renew automatically each billing cycle unless canceled. By
                    subscribing, you agree to recurring billing.
                </p>
                <ul>
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
            <section>
                <h2>
                    3. Cancellations
                </h2>
                <p>
                    You can cancel your subscription at any time from your account settings.
                    Key points to note:
                </p>
                <ul>
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
            <section>
                <h2>4. Refunds</h2>
                <p>
                    As our services are digital and subscription-based, we generally follow a{" "}
                    <strong>no-refund policy</strong>. However, refunds may be considered under
                    the following conditions:
                </p>
                <ul>
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
                <p>
                    Refund approvals are at the sole discretion of <strong>MockQube</strong>.
                    If approved, refunds are processed back to your original payment method and
                    may take 5–10 business days to reflect, depending on your bank or payment provider.
                </p>
            </section>

            {/* 5. Trial Periods */}
            <section>
                <h2>5. Trial Periods</h2>
                <p>
                    If we offer free trials in the future, they will convert automatically to a
                    paid plan at the end of the trial unless canceled before the trial expires.
                    Once billed, standard cancellation and refund terms apply.
                </p>
            </section>

            {/* 6. Policy Updates */}
            <section>
                <h2>
                    6. Policy Updates
                </h2>
                <p>
                    We may update this Refund & Cancellation Policy to reflect changes in our
                    business or legal requirements. Updated versions will be posted on this
                    page with a new effective date.
                </p>
            </section>

            {/* 7. Contact */}
            <section>
                <h2>7. Contact Us</h2>
                <p>
                    For refund or cancellation requests, please contact us at:{" "}
                    <a href="mailto:support@example.com" className="in">
                        support@example.com
                    </a>
                </p>
            </section>
        </LegalLayout>
    );
}
