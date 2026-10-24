import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./start.css";
import AppHeader from "@/component/home/AppHeader";
import HomeFooter from "@/component/home/HomeFooter";
import StartInterviewClient from "@/component/start-interview/StartInterviewClient";

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

export default function StartInterviewPage() {
  return (
    <div className={`mqs ${bricolage.variable} ${figtree.variable}`}>
      <AppHeader active={null} />
      <main className="page">
        <div className="disc" aria-hidden="true"></div>
        <StartInterviewClient />
      </main>
      <HomeFooter />
    </div>
  );
}
