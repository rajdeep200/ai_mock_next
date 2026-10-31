import { Suspense } from "react";
import type { Metadata } from "next";
import { bricolage, figtree } from "@/lib/fonts";
import "./return.css";
import AppHeader from "@/component/home/AppHeader";
import HomeFooter from "@/component/home/HomeFooter";
import PaymentStatus from "./SuccessReturn";

export const metadata: Metadata = {
  title: "Payment status | MockQube",
  robots: { index: false, follow: false },
};

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
