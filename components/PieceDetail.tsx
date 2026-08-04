import { OrderButton } from "./OrderButton";
import type { Piece } from "@/lib/pieces";

/**
 * The detail panel. Shared by the intercepted modal and the standalone
 * /gallery/[slug] page so the two can never drift.
 *
 * Rows whose content she has not written yet are omitted rather than filled
 * with plausible text. Dimensions, materials, lead time and the story note are
 * all null across every piece today.
 */
export function PieceDetail({ piece }: { piece: Piece }) {
  const facts = [piece.dimensions, piece.materials, piece.leadTime].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-6">
      <p className="eyebrow text-ink-muted">{piece.category}</p>

      <h1 className="font-display text-display-md text-ink">{piece.title}</h1>

      {facts.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-caption text-ink-muted">
          {facts.map((f, i) => (
            <span key={f} className="flex items-center gap-3">
              {i > 0 && <span className="h-3 w-px bg-line" aria-hidden />}
              {f}
            </span>
          ))}
        </div>
      )}

      {piece.storyNote && <p className="text-body text-ink-muted">{piece.storyNote}</p>}

      {piece.vibes.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {piece.vibes.map((v) => (
            <li
              key={v}
              className="rounded-control border border-line px-3 py-1 text-caption text-ink-muted"
            >
              {v}
            </li>
          ))}
        </ul>
      )}

      {/* Opens the order form with this piece already attached as a reference.
          It does not navigate. */}
      <OrderButton piece={piece.slug} className="mt-2 self-start">
        Start with this
      </OrderButton>
    </div>
  );
}
