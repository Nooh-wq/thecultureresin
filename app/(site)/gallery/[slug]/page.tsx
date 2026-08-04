import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CuredImage } from "@/components/CuredImage";
import { PieceDetail } from "@/components/PieceDetail";
import { PieceSchema } from "@/components/StructuredData";
import { getPiece, getPieces } from "@/lib/gallery";
import { PIECES } from "@/lib/pieces";

type Params = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    return (await getPieces()).map((p) => ({ slug: p.slug }));
  } catch {
    // A build with no reachable database still prerenders what ships in the repo.
    return PIECES.map((p) => ({ slug: p.slug }));
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const piece = await getPiece(slug);
  if (!piece) return {};
  return {
    title: `${piece.title} | The Culture Resin`,
    description: piece.storyNote ?? piece.images[0].alt,
    openGraph: {
      title: `${piece.title} | The Culture Resin`,
      description: piece.storyNote ?? piece.images[0].alt,
      images: [{ url: piece.images[0].src }],
    },
  };
}

/**
 * The standalone page behind the intercepted modal. This is what a shared link
 * or a refresh lands on, so it has to stand on its own.
 */
export default async function PiecePage({ params }: Params) {
  const { slug } = await params;
  const piece = await getPiece(slug);
  if (!piece) notFound();

  return (
    <section className="mx-auto max-w-content px-6 pt-section pb-section md:px-10 md:pt-section-lg md:pb-section-lg">
      <PieceSchema piece={piece} />

      <Link href="/gallery" className="eyebrow text-ink-muted hover:text-ink">
        Back to the gallery
      </Link>

      <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-16">
        <div className="md:col-span-2">
          <CuredImage
            src={piece.images[0].src}
            alt={piece.images[0].alt}
            width={piece.images[0].width}
            height={piece.images[0].height}
            blurDataUrl={piece.images[0].blurDataUrl}
            sizes="(max-width: 768px) 100vw, 66vw"
            className="w-full"
            priority
          />
        </div>
        <PieceDetail piece={piece} />
      </div>
    </section>
  );
}
