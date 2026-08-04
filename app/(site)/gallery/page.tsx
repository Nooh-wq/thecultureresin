import type { Metadata } from "next";
import { GalleryGrid } from "@/components/GalleryGrid";
import { getPieces, getUsedCategories } from "@/lib/gallery";

/** Re-reads the database at most once a minute, so admin edits show up. */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "The work | The Culture Resin",
  description:
    "Handmade resin clocks, trays, jewellery and keepsakes from Islamabad. Everything was made for one person who asked for it.",
};

export default async function Gallery() {
  const [pieces, categories] = await Promise.all([getPieces(), getUsedCategories()]);

  return (
    <section className="mx-auto max-w-content px-6 pt-section pb-section md:px-10 md:pt-section-lg md:pb-section-lg">
      <div className="max-w-prose">
        <p className="eyebrow text-ink-muted">The work</p>
        <h1 className="mt-6 font-display text-display-lg text-ink">
          Everything here was made for one person who asked for it.
        </h1>
        {/* Verbatim from tcr-copy.md. Note this is the only unhedged version of
            the claim: Home says "Most of what I make has existed once" and
            About says "Almost nothing gets made twice". Flagged, not changed. */}
        <p className="mt-8 text-body-lg text-ink-muted">
          Nothing gets made twice. If you see something close to what you want, start from it and
          we&rsquo;ll change whatever needs changing.
        </p>
      </div>

      <div className="mt-16 md:mt-24">
        {/* Only categories that actually have work in them. Tables and Wall art
            have no pieces yet, so their chips would lead nowhere. */}
        <GalleryGrid pieces={pieces} categories={categories} />
      </div>
    </section>
  );
}
