// app/s/[slug]/page.tsx
import { Metadata } from "next";
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";
import type { Types } from "mongoose";

type Props = { params: Promise<{ slug: string }> };

type PublicSession = {
    _id: Types.ObjectId;
    technology: string;
    level: string;
    duration: number;
    status: "active" | "completed";
    updatedAt: Date;
    modelPreparationPercent?: number | null;
    feedback?: string | null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    await connectToDB();
    const doc = await InterviewSession.findOne({ shareSlug: slug, shareEnabled: true }).lean<PublicSession | null>();
    if (!doc) {
        return { title: "MockQube — Not Found" };
    }
    const title = `I completed a mock interview in ${doc.technology} • MockQube`;
    const desc = doc.modelPreparationPercent != null
        ? `Preparation: ${doc.modelPreparationPercent}% • Level: ${doc.level}`
        : `Level: ${doc.level} • Completed on ${new Date(doc.updatedAt).toDateString()}`;

    const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og/session/${slug}`;

    return {
        title,
        description: desc,
        openGraph: {
            title,
            description: desc,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/s/${slug}`,
            images: [{ url: ogImageUrl, width: 1200, height: 630 }],
            siteName: "MockQube",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description: desc,
            images: [ogImageUrl],
        },
    };
}

export default async function SharePage({ params }: Props) {
    const { slug } = await params
    await connectToDB();
    const doc = await InterviewSession.findOne({ shareSlug: slug, shareEnabled: true }).lean<PublicSession | null>();

    if (!doc) {
        // Optionally reuse your not-found styling
        return (
            <main className="mx-auto max-w-2xl px-6 py-16 text-center text-gray-300">
                <h1 className="text-3xl font-bold">This share link is not available.</h1>
                <p className="mt-2 text-gray-400">The owner may have turned off sharing.</p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-2xl px-6 py-12 text-gray-200">
            <div className="rounded-2xl border border-gray-800 bg-black/60 p-6">
                <div className="flex items-center gap-2 text-sm text-emerald-300">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" /> MockQube
                </div>
                <h1 className="mt-3 text-2xl font-extrabold">
                    Mock Interview Completed — {doc.technology}
                </h1>
                <p className="mt-1 text-gray-400">
                    Level: <span className="text-gray-200">{doc.level}</span> • Duration: {doc.duration}m
                </p>

                {typeof doc.modelPreparationPercent === "number" && (
                    <p className="mt-3 text-lg">
                        Preparation: <span className="font-semibold text-emerald-300">{doc.modelPreparationPercent}%</span>
                    </p>
                )}

                {/* Optional: show a safe excerpt from feedback */}
                {doc.feedback && (
                    <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                        <p className="text-sm text-gray-300 whitespace-pre-line">
                            {doc.feedback.split("\n").slice(0, 10).join("\n")}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">Shared summary (first lines only)</p>
                    </div>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                    <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/s/${slug}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/20 transition hover:bg-emerald-500/15 hover:text-emerald-200"
                    >
                        Share on LinkedIn
                    </a>
                    <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                            `I just completed a ${doc.level} mock interview in ${doc.technology} on @MockQube!`
                        )}&url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/s/${slug}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2 text-sm font-semibold text-gray-200 hover:border-gray-600 hover:bg-gray-900"
                    >
                        Share on X
                    </a>
                    <a
                        href={`https://wa.me/?text=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/s/${slug}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2 text-sm font-semibold text-gray-200 hover:border-gray-600 hover:bg-gray-900"
                    >
                        WhatsApp
                    </a>
                </div>
            </div>
        </main>
    );
}
