import Link from "next/link";
import { AddPieceModal } from "@/components/admin/AddPieceModal";
import { getAdminPrisma } from "@/lib/admin-guard";
import { plural, prettyEnum } from "@/lib/format";

export default async function GalleryAdmin() {
  const prisma = await getAdminPrisma();
  if (!prisma) return null;

  const pieces = await prisma.piece.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
      _count: { select: { images: true } },
    },
  });

  return (
    <>
      <div className="flex items-center justify-between gap-6">
        <h1 className="font-display text-display-md text-ink">Gallery</h1>
        <AddPieceModal />
      </div>

      <ul className="mt-10">
        {pieces.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-4"
          >
            <Link href={`/admin/gallery/${p.id}`} className="flex items-center gap-4">
              {p.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.images[0].url}
                  alt=""
                  className="h-14 w-14 object-cover"
                  // Same crop the gallery card uses, so the list previews the
                  // focal point rather than always showing the centre.
                  style={{
                    objectPosition: `${p.images[0].focalX * 100}% ${p.images[0].focalY * 100}%`,
                  }}
                />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center border border-line text-caption text-ink-muted">
                  0
                </span>
              )}
              <span className="text-body text-ink">{p.title}</span>
              <span className="text-caption text-ink-muted">{prettyEnum(p.category)}</span>
              <span className="text-caption text-ink-muted">
                {plural(p._count.images, "image")}
              </span>
            </Link>
            <span className="eyebrow text-ink-muted">{p.published ? "Live" : "Draft"}</span>
          </li>
        ))}
        {pieces.length === 0 && (
          <li className="py-6 text-body text-ink-muted">
            No pieces yet. Add the first one with the button above.
          </li>
        )}
      </ul>
    </>
  );
}
