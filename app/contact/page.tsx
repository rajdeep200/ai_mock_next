// app/contact/page.tsx
import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import SiteShell from "@/component/site/SiteShell";

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
        <SiteShell active="contact">
            <div className="contact">
                <div>
                    <span className="eyebrow reveal"><i></i>We read every message</span>
                    <h1 className="reveal d1">Contact <b>Us</b></h1>
                    <p className="lede reveal d2">
                        Have questions, feedback, or partnership ideas? We’d love to hear from you. We usually respond within 1–2 business days.
                    </p>

                    <div className="ways reveal d3">
                        <a className="way" href="mailto:support@mockqube.com">
                            <span className="ico">
                                <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 8l9 6 9-6" /></svg>
                            </span>
                            <div><small>Or email us directly</small><b>support@mockqube.com</b></div>
                        </a>
                        <div className="way">
                            <span className="ico">
                                <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                            </span>
                            <div><small>Response time</small><b>1–2 business days</b></div>
                        </div>
                    </div>

                    <div className="topics reveal d3"><span>Support</span><span>Feedback</span><span>Partnerships</span><span>Press</span></div>
                </div>

                <ContactForm />
            </div>
        </SiteShell>
    );
}
