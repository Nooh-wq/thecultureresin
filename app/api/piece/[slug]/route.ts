import { NextResponse } from "next/server";
import { getPiece } from "@/lib/gallery";

/**
 * Just enough about one piece for the order form to show what someone is
 * starting from.
 *
 * The form is a client component and cannot query the database, and now that
 * the gallery is database-backed it can no longer read the static list either.
 * Explicitly narrowed: title and one image, nothing else.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const piece = await getPiece(slug);
  if (!piece) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const image = piece.images[0];
  return NextResponse.json({
    slug: piece.slug,
    title: piece.title,
    image: image
      ? {
          src: image.src,
          alt: image.alt,
          width: image.width,
          height: image.height,
          focalX: image.focalX,
          focalY: image.focalY,
        }
      : null,
  });
}
