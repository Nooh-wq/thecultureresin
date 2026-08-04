import { notFound } from "next/navigation";
import { deletePiece, savePiece } from "@/app/admin/actions";
import { DeletePieceButton } from "@/components/admin/DeletePieceButton";
import { ImageManager } from "@/components/admin/ImageManager";
import { getAdminPrisma } from "@/lib/admin-guard";

const CATEGORIES = ["CLOCKS", "TABLES", "TRAYS", "WALL_ART", "JEWELLERY", "KEEPSAKES"] as const;

export default async function EditPiece({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prisma = await getAdminPrisma();
  if (!prisma) return null;

  const piece = await prisma.piece.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!piece) notFound();

  return (
    <>
      <h1 className="font-display text-display-md text-ink">{piece.title}</h1>

      <form action={savePiece} className="mt-10 flex max-w-xl flex-col gap-5">
        <input type="hidden" name="id" value={piece.id} />

        <Text name="title" label="Title" defaultValue={piece.title} required />
        <Text name="slug" label="Slug" defaultValue={piece.slug} required />

        <label className="flex flex-col gap-2">
          <span className="eyebrow text-ink-muted">Category</span>
          <select
            name="category"
            defaultValue={piece.category}
            className="rounded-control border border-line bg-surface px-4 py-3 text-body text-ink focus:border-ink-muted focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="eyebrow text-ink-muted">Story note</span>
          <input
            name="storyNote"
            maxLength={140}
            defaultValue={piece.storyNote ?? ""}
            className="rounded-control border border-line bg-surface px-4 py-3 text-body text-ink focus:border-ink-muted focus:outline-none"
          />
          <span className="text-caption text-ink-muted">
            Your words, 140 characters at most. Shown in the piece popup.
          </span>
        </label>

        <Text name="dimensions" label="Dimensions" defaultValue={piece.dimensions ?? ""} />
        <Text name="materials" label="Materials" defaultValue={piece.materials ?? ""} />
        <Text name="leadTime" label="Lead time" defaultValue={piece.leadTime ?? ""} />

        <label className="flex flex-col gap-2">
          <span className="eyebrow text-ink-muted">Home caption</span>
          <input
            name="featuredCaption"
            defaultValue={piece.featuredCaption ?? ""}
            className="rounded-control border border-line bg-surface px-4 py-3 text-body text-ink focus:border-ink-muted focus:outline-none"
          />
          <span className="text-caption text-ink-muted">
            Only shown in Home&rsquo;s Selected work. Separate from the story note.
          </span>
        </label>

        <div className="flex flex-wrap gap-6">
          <label className="flex flex-col gap-2">
            <span className="eyebrow text-ink-muted">Featured order</span>
            <input
              name="featuredOrder"
              type="number"
              defaultValue={piece.featuredOrder ?? ""}
              className="w-32 rounded-control border border-line bg-surface px-3 py-2 text-caption text-ink focus:border-ink-muted focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="eyebrow text-ink-muted">Sort order</span>
            <input
              name="sortOrder"
              type="number"
              defaultValue={piece.sortOrder}
              className="w-32 rounded-control border border-line bg-surface px-3 py-2 text-caption text-ink focus:border-ink-muted focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-3 self-end pb-2">
            <input
              name="published"
              type="checkbox"
              defaultChecked={piece.published}
              className="accent-rose"
            />
            <span className="eyebrow text-ink-muted">Live</span>
          </label>
        </div>

        <button
          type="submit"
          className="eyebrow self-start rounded-control bg-ink px-6 py-3 text-canvas hover:opacity-85"
        >
          Save
        </button>
      </form>

      <h2 className="mt-16 font-display text-display-md text-ink">Images</h2>
      <div className="mt-8">
        <ImageManager pieceId={piece.id} images={piece.images} />
      </div>

      {/* The action is bound here and passed down, so the client component
          never learns the piece id and there is nothing for it to tamper with.
          deletePiece re-checks the session regardless. */}
      <DeletePieceButton
        title={piece.title}
        imageCount={piece.images.length}
        action={async () => {
          "use server";
          await deletePiece(id);
        }}
      />
    </>
  );
}

function Text({
  name,
  label,
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="eyebrow text-ink-muted">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="rounded-control border border-line bg-surface px-4 py-3 text-body text-ink focus:border-ink-muted focus:outline-none"
      />
    </label>
  );
}
