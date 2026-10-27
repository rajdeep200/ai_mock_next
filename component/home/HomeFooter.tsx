import Link from "next/link";
import Image from "next/image";

export default function HomeFooter() {
  return (
    <footer className="site">
      <div className="wrap">
        <div>
          <Link href="/" className="logo">
            <Image src="/mockqubelogo.png" alt="" width={26} height={30} />
            MockQube
          </Link>
          <p className="tagline">AI-powered DSA mock interviews &amp; actionable feedback.</p>
        </div>
        <nav aria-label="Footer">
          <Link href="/" rel="home">Home</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About Us</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
