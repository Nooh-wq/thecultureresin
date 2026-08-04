/**
 * The site's own origin, resolved once and defensively.
 *
 * This exists because a single stray character took a production build down.
 * NEXT_PUBLIC_SITE_URL was pasted into Vercel with its surrounding quotes
 * included, so the value was literally `"https://thecultureresin.com"`, and
 * `new URL()` in app/layout.tsx threw ERR_INVALID_URL while collecting page
 * data. The build failed on /_not-found, which points nowhere near the actual
 * cause.
 *
 * Two defences:
 *
 *   Quotes are stripped. Pasting a .env line into a dashboard field is a
 *   normal mistake and it should not be fatal. A trailing slash goes too, so
 *   `${SITE}/gallery` cannot become a double slash.
 *
 *   An unparseable value falls back to localhost instead of throwing. A wrong
 *   canonical URL is a bad day for SEO; a build that will not deploy is a site
 *   that is down. Given the choice, degrade.
 *
 * The warning is deliberately loud, because a silent fallback to localhost in
 * production would put http://localhost:3000 into the sitemap and into her
 * password reset links.
 */
const FALLBACK = "http://localhost:3000";

function resolve(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK;

  // One matching pair of surrounding quotes, and only a matching pair.
  const unquoted = raw.replace(/^(['"])(.*)\1$/, "$2").trim();
  const withoutTrailingSlash = unquoted.replace(/\/+$/, "");

  try {
    new URL(withoutTrailingSlash);
    return withoutTrailingSlash;
  } catch {
    console.warn(
      `[site-url] NEXT_PUBLIC_SITE_URL is not a valid URL (${JSON.stringify(raw)}). ` +
        `Falling back to ${FALLBACK}. Canonical URLs, the sitemap and password ` +
        `reset links will all be wrong until this is fixed.`,
    );
    return FALLBACK;
  }
}

export const SITE_URL = resolve();
