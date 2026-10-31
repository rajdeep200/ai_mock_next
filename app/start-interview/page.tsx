import { bricolage, figtree } from "@/lib/fonts";
import "./start.css";
import AppHeader from "@/component/home/AppHeader";
import HomeFooter from "@/component/home/HomeFooter";
import StartInterviewClient from "@/component/start-interview/StartInterviewClient";

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
