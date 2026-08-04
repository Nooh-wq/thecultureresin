import type { MetadataRoute } from "next";
import { getPieces } from "@/lib/gallery";
import { SITE_URL as SITE } from "@/lib/site-url";

/**
 * Rebuilt hourly. Without this the sitemap is prerendered once at build time,
 * so reading from the database would still only ever describe the pieces that
 * existed when the deploy ran. An hour is well inside how often she adds work.
 */
export const revalidate = 3600;

/**
 * Reads from lib/gallery, the database layer, not from lib/pieces.
 *
 * It read the static file until now, which meant the sitemap described the
 * eight pieces that shipped in the repo and nothing else: a piece she added
 * through the admin was never listed, and one she unpublished or deleted stayed
 * listed and fed search engines a URL that 404s. This is the same bug that was
 * fixed for the gallery itself, and the sitemap was missed because it renders
 * nothing, so nothing ever looked wrong.
 *
 * getPieces() filters to published and already falls back to the static list
 * when the database is unreachable, so there is no try/catch here.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pieces = await getPieces();

  return [
    { url: SITE, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/gallery`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
    ...pieces.map((p) => ({
      url: `${SITE}/gallery/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
