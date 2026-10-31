// app/invite/[token]/page.tsx
import type { Metadata } from "next";
import SiteShell from "@/component/site/SiteShell";
import "./invite.css";
import InviteClient from "./InviteClient";

export const metadata: Metadata = {
  title: "Claim your invite | MockQube",
  robots: { index: false, follow: false },
};

export default function InvitePage() {
  return (
    <SiteShell>
      <InviteClient />
    </SiteShell>
  );
}
