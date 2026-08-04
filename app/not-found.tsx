import Link from "next/link";

/**
 * Sits outside the (site) group, so it carries its own minimal shell rather
 * than the full header and footer.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 pt-10 md:px-12">
        <Link
          href="/"
          className="font-display text-[1.25rem] leading-none tracking-eyebrow text-ink"
          aria-label="The Culture Resin, home"
        >
          TCR
        </Link>
      </header>

      <main className="flex flex-1 items-center px-6 md:px-12">
        <div className="mx-auto flex w-full max-w-content flex-col items-start gap-6">
          <h1 className="font-display text-display-lg text-ink">This page doesn&rsquo;t exist.</h1>
          <p className="max-w-prose text-body-lg text-ink-muted">
            It might have moved, or it might never have been here.
          </p>
          <Link
            href="/gallery"
            className="eyebrow mt-4 rounded-control border border-line px-6 py-3 text-ink transition-colors duration-200 hover:border-ink"
          >
            Back to the gallery
          </Link>
        </div>
      </main>
    </div>
  );
}
