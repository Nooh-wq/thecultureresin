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
  /**
   * Labelled, because these were three bare values separated by hairlines and
   * a piece reading "1 | 1 | 1" tells nobody which number is the size and
   * which is the wait. They are only obvious when you already know the order
   * they were written in.
   *
   * A definition list rather than a row of spans: these are pairs, and saying
   * so means a screen reader announces "Size, 40cm across" instead of running
   * three unrelated values together.
   */
  const facts = [
    ["Size", piece.dimensions],
    ["Made from", piece.materials],
    ["Takes about", piece.leadTime],
  ].filter(([, value]) => Boolean(value)) as [string, string][];

  return (
    <div className="flex flex-col gap-6">
      <p className="eyebrow text-ink-muted">{piece.category}</p>

      <h1 className="font-display text-display-md text-ink">{piece.title}</h1>

      {facts.length > 0 && (
        <dl className="flex flex-col gap-2">
          {facts.map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-3">
              <dt className="eyebrow shrink-0 text-ink-muted">{label}</dt>
              <dd className="text-caption text-ink">{value}</dd>
            </div>
          ))}
        </dl>
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
