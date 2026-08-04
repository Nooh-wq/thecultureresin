"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CuredImage } from "./CuredImage";
import { GALLERY_VIBES, focalPosition, type Category, type Piece, type Vibe } from "@/lib/pieces";

function EyeIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function GalleryGrid({
  pieces,
  categories,
}: {
  pieces: Piece[];
  categories: readonly Category[];
}) {
  const [category, setCategory] = useState<Category | null>(null);
  const [vibe, setVibe] = useState<Vibe | null>(null);

  const filtered = useMemo(
    () =>
      pieces.filter(
        (p) => (!category || p.category === category) && (!vibe || p.vibes.includes(vibe)),
      ),
    [pieces, category, vibe],
  );

  const clear = () => {
    setCategory(null);
    setVibe(null);
  };

  const chip = (active: boolean) =>
    `eyebrow whitespace-nowrap transition-colors duration-200 ${
      active ? "text-rose" : "text-ink-muted hover:text-ink"
    }`;

  return (
    <>
      {/*
        The two filter rows wrap rather than scroll sideways.

        They were overflow-x-auto with a negative margin so the row could bleed
        to the screen edge, which on a phone hid Keepsakes, Wall art and half
        the vibes behind a horizontal scroll nobody knew was there. A filter you
        cannot see is a filter that does not exist, and there is no affordance
        pointing at it: the chips are plain text with no scrollbar on iOS.

        Wrapping costs a couple of lines of height and makes every option
        visible at once. Desktop is unaffected, both rows already fit there.
      */}
      <div className="flex flex-col gap-4 border-b border-line pb-8 md:flex-row md:items-center md:gap-8">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <button type="button" onClick={() => setCategory(null)} className={chip(!category)}>
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={chip(category === c)}
            >
              {c}
            </button>
          ))}
        </div>

        <span className="hidden h-4 w-px shrink-0 bg-line md:block" aria-hidden />

        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {GALLERY_VIBES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVibe(vibe === v ? null : v)}
              className={chip(vibe === v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-start gap-6 py-section">
          <p className="text-body-lg text-ink-muted">Nothing in that combination yet.</p>
          <button
            type="button"
            onClick={clear}
            className="eyebrow rounded-control border border-line px-6 py-3 text-ink transition-colors duration-200 hover:border-ink"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-x-6 gap-y-12 pt-12 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((piece, i) => (
            <li key={piece.slug}>
              <Link href={`/gallery/${piece.slug}`} scroll={false} className="group block">
                <div className="relative overflow-hidden">
                  {/* Cards are a fixed 4:5, so most photographs get cropped.
                      The focal point decides what survives. */}
                  <CuredImage
                    src={piece.images[0].src}
                    alt={piece.images[0].alt}
                    width={piece.images[0].width}
                    height={piece.images[0].height}
                    index={i % 3}
                    blurDataUrl={piece.images[0].blurDataUrl}
                    focal={focalPosition(piece.images[0])}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="aspect-[4/5] w-full [&_img]:aspect-[4/5] [&_img]:w-full [&_img]:object-cover"
                  />

                  {/* Desktop: scrim and eye fade in on hover. */}
                  <div className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-canvas/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
                    <EyeIcon className="h-8 w-8 text-ink" />
                  </div>

                  {/* Mobile has no hover, so the eye is always there. */}
                  <EyeIcon className="absolute bottom-3 right-3 h-6 w-6 text-ink opacity-60 md:hidden" />
                </div>

                {/* Title only. No category, no price, no year. */}
                <p className="mt-4 text-body text-ink">{piece.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
