import { notFound } from "next/navigation";
import { PieceModal } from "@/components/PieceModal";
import { getPiece } from "@/lib/gallery";

export default async function InterceptedPiece({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const piece = await getPiece(slug);
  if (!piece) notFound();
  return <PieceModal piece={piece} />;
}
