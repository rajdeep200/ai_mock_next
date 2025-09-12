import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.mockqube.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // block anything you don’t want indexed:
      disallow: ["/api/", "/admin/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
