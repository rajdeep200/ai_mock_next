import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { bricolage, figtree } from "@/lib/fonts";
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
