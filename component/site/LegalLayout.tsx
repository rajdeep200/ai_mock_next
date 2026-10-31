import Link from "next/link";
import SiteShell from "./SiteShell";
import LegalToc from "./LegalToc";

// Shared layout for the legal pages: heading, sticky table of contents, the document, and links to the related pages.
export default function LegalLayout({
  title,
  effective,
  lede,
  related,
  children,
}: {
  title: string;
  effective: string;
  lede?: React.ReactNode;
  related: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  const words = title.split(" ");
  const last = words.pop();
  return (
    <SiteShell>
      <header className="legal-h">
        <span className="eyebrow reveal"><i></i>Legal</span>
        <h1 className="reveal d1">{words.join(" ")}{words.length ? " " : ""}<b>{last}</b></h1>
        <div className="meta reveal d2"><span className="chip">Effective {effective}</span></div>
        {lede && <p className="lede reveal d2">{lede}</p>}
      </header>

      <div className="legal">
        <LegalToc />
        <article className="doc reveal d2">{children}</article>
      </div>

      <div className="legal-foot">
        <div>
          <h3>Questions about this page?</h3>
          <p>Email <a href="mailto:support@mockqube.com">support@mockqube.com</a> and we&apos;ll get back to you.</p>
        </div>
        <div className="links">
          {related.map((r, i) => (
            <Link key={r.href} href={r.href} className={`btn sm${i === 0 ? " sun" : " ghost"}`}>{r.label}</Link>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
