import { Suspense } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./return.css";
import AppHeader from "@/component/home/AppHeader";
import HomeFooter from "@/component/home/HomeFooter";
import PaymentStatus from "./SuccessReturn";

export const metadata: Metadata = {
  title: "Payment status | MockQube",
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

export default function Page() {
  return (
    <div className={`mqb ${bricolage.variable} ${figtree.variable}`}>
      <AppHeader active={null} />
      <Suspense fallback={<main className="page" data-s="checking"><div className="wrap" /></main>}>
        <PaymentStatus />
      </Suspense>
      <HomeFooter />
    </div>
  );
}
