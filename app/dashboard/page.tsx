import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./dashboard.css";
import AppHeader from "@/component/home/AppHeader";
import HomeFooter from "@/component/home/HomeFooter";
import DashboardClient from "@/component/dashboard/DashboardClient";
import { loadDashboard } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your progress | MockQube",
  robots: { index: false, follow: false },
};

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["300", "500", "700"],
  variable: "--font-bricolage",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-figtree",
  display: "swap",
});

export default async function DashboardPage() {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const data = await loadDashboard(userId);

  return (
    <div className={`mqd ${bricolage.variable} ${figtree.variable}`}>
      <AppHeader active="dashboard" />
      <main className="page">
        <div className="disc" aria-hidden="true"></div>
        <DashboardClient data={data} />
      </main>
      <HomeFooter />
    </div>
  );
}
