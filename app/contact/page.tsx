// app/contact/page.tsx
import type { Metadata } from "next";
import ContactForm from "./ContactForm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.mockqube.com";
const CANONICAL = `${SITE_URL}/contact-us`;
export const metadata: Metadata = {
    title: "Contact Us – MockQube",
    description:
        "Contact the MockQube team for support, feedback, partnerships, or press. We usually respond within 1–2 business days.",
    alternates: { canonical: CANONICAL },
    openGraph: {
        url: CANONICAL,
        type: "website",
        title: "Contact MockQube",
        description:
            "Questions about AI DSA mock interviews, pricing, or partnerships? Contact us.",
        images: [{ url: "/mockqubelogo.png", width: 1200, height: 630 }],
        siteName: "MockQube",
    },
    twitter: {
        card: "summary_large_image",
        title: "Contact MockQube",
        description: "Support, partnerships, and general queries.",
        images: ["/mockqubelogo.png"],
    },
};

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-black text-white">
            <section className="mx-auto max-w-3xl px-4 sm:px-8 py-12">
                <h1 className="text-3xl sm:text-4xl font-bold text-green-400 mb-2">
                    Contact Us
                </h1>
                <p className="text-gray-300 mb-8">
                    Have questions, feedback, or partnership ideas? We’d love to hear from you.
                </p>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <ContactForm />
                    <div className="mt-6 text-sm text-gray-400">
                        Or email us directly at{" "}
                        <a
                            className="text-green-400 hover:underline"
                            href="mailto:support@mockqube.com"
                        >
                            support@mockqube.com
                        </a>
                        .
                    </div>
                </div>
            </section>
        </main>
    );
}
