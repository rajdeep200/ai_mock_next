import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./site.css";
import SiteHeader from "./SiteHeader";
import HomeFooter from "@/component/home/HomeFooter";

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

// Page frame shared by About, Contact and the legal pages.
export default function SiteShell({
  active = null,
  children,
}: {
  active?: "about" | "contact" | null;
  children: React.ReactNode;
}) {
  return (
    <div className={`mqw ${bricolage.variable} ${figtree.variable}`}>
      <SiteHeader active={active} />
      <main className="page">
        <div className="disc" aria-hidden="true"></div>
        <div className="wrap">{children}</div>
      </main>
      <HomeFooter />
    </div>
  );
}
