"use client"

// app/interview/page.tsx
import dynamic from "next/dynamic";

// disable SSR for your client interviewer
const ClientInterview = dynamic(
  () => import("./ClientInterview"),
  { ssr: false }
);

export default function Page() {
  return <ClientInterview />;
}
