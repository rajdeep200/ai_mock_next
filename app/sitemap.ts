// app/sitemap.ts
import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.mockqube.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static marketing routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/home`, lastModified: now },
    { url: `${base}/interview`, lastModified: now },
    { url: `${base}/start-interview`, lastModified: now },
    { url: `${base}/about`, lastModified: now },
    { url: `${base}/terms`, lastModified: now },
    { url: `${base}/pricing`, lastModified: now },
    { url: `${base}/history`, lastModified: now },
    { url: `${base}/blog/what-is-mockqube`, lastModified: now },
  ];

  // OPTIONAL: add dynamic routes (e.g., blog posts, docs, etc.)
  // const posts = await getPostSlugs(); // your own data source
  // const postEntries = posts.map(p => ({
  //   url: `${base}/blog/${p.slug}`,
  //   lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
  // }));
  // return [...staticRoutes, ...postEntries];

  return staticRoutes;
}
