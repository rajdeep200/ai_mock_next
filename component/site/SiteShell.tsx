import { bricolage, figtree } from "@/lib/fonts";
import "./site.css";
import SiteHeader from "./SiteHeader";
import HomeFooter from "@/component/home/HomeFooter";

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
