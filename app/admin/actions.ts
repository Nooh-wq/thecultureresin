"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrisma, hasDatabase } from "@/lib/db";

/**
 * Server actions are public HTTP endpoints. Every one of them re-checks the
 * session, because the /admin layout's gate protects rendering, not these.
 */
async function requireOwner() {
  if (!hasDatabase) throw new Error("No database configured.");
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in.");
  return getPrisma();
}

export async function updateOrderStatus(id: string, status: string) {
  const prisma = await requireOwner();
  await prisma.order.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { status: status as any },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

/** Both of these are private. They must never appear in a public query. */
export async function saveOrderPrivate(id: string, formData: FormData) {
  const prisma = await requireOwner();
  const notes = String(formData.get("internalNotes") ?? "");
  const quoted = String(formData.get("quotedAmount") ?? "").trim();

  await prisma.order.update({
    where: { id },
    data: {
      internalNotes: notes || null,
      quotedAmount: quoted ? quoted : null,
    },
  });
  revalidatePath(`/admin/orders/${id}`);
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export async function savePiece(formData: FormData) {
  const prisma = await requireOwner();

  const id = String(formData.get("id") ?? "");
  const data = {
    slug: String(formData.get("slug") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    category: String(formData.get("category") ?? "KEEPSAKES") as any,
    storyNote: String(formData.get("storyNote") ?? "").trim() || null,
    dimensions: String(formData.get("dimensions") ?? "").trim() || null,
    materials: String(formData.get("materials") ?? "").trim() || null,
    leadTime: String(formData.get("leadTime") ?? "").trim() || null,
    featuredCaption: String(formData.get("featuredCaption") ?? "").trim() || null,
    featuredOrder: formData.get("featuredOrder")
      ? Number(formData.get("featuredOrder"))
      : null,
    published: formData.get("published") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  };

  if (!data.slug || !data.title) throw new Error("A piece needs a slug and a title.");
  if (data.storyNote && data.storyNote.length > 140) {
    throw new Error("The story note has to be 140 characters or fewer.");
  }

  if (id) await prisma.piece.update({ where: { id }, data });
  else await prisma.piece.create({ data });

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export type NewPieceState = { error?: string; ok?: boolean };

type IncomingImage = {
  url: string;
  width: number;
  height: number;
  blurDataUrl: string;
  alt: string;
  focalX: number;
  focalY: number;
};

/**
 * Creates a piece and all of its images in one transaction.
 *
 * The add-a-piece modal collects everything up front, so a half-created piece
 * with no images should never exist. Images are already on Cloudinary by the
 * time this runs; only their metadata arrives here.
 */
export async function createPieceWithImages(
  _prev: NewPieceState,
  formData: FormData,
): Promise<NewPieceState> {
  const prisma = await requireOwner();

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!title) return { error: "A piece needs a title." };
  if (!slug) return { error: "A piece needs a slug." };

  const storyNote = String(formData.get("storyNote") ?? "").trim();
  if (storyNote.length > 140) {
    return { error: "The story note has to be 140 characters or fewer." };
  }

  let images: IncomingImage[] = [];
  try {
    images = JSON.parse(String(formData.get("images") ?? "[]"));
  } catch {
    return { error: "Something went wrong with the images. Try again." };
  }

  const missingAlt = images.find((i) => !i.alt || i.alt.trim().length < 10);
  if (missingAlt) {
    return {
      error:
        "Every image needs a real description, like “black and gold resin wall clock with gold Roman numerals”.",
    };
  }

  const existing = await prisma.piece.findUnique({ where: { slug }, select: { id: true } });
  if (existing) return { error: "There is already a piece with that slug." };

  const vibes = formData.getAll("vibes").map(String);

  try {
    await prisma.piece.create({
      data: {
        title,
        slug,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: String(formData.get("category") ?? "KEEPSAKES") as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vibes: vibes as any,
        storyNote: storyNote || null,
        dimensions: String(formData.get("dimensions") ?? "").trim() || null,
        materials: String(formData.get("materials") ?? "").trim() || null,
        leadTime: String(formData.get("leadTime") ?? "").trim() || null,
        published: formData.get("published") === "on",
        sortOrder: Number(formData.get("sortOrder") ?? 0),
        images: {
          create: images.map((i, n) => ({
            url: i.url,
            width: i.width,
            height: i.height,
            blurDataUrl: i.blurDataUrl ?? "",
            alt: i.alt.trim(),
            focalX: i.focalX ?? 0.5,
            focalY: i.focalY ?? 0.5,
            sortOrder: n,
          })),
        },
      },
    });
  } catch {
    return { error: "That didn’t save. Try again." };
  }

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Deleting used to leave her staring at "this page doesn't exist".
 *
 * The delete happens on /admin/gallery/[id], so once the row is gone that
 * route re-renders, finds nothing and calls notFound(). Nothing was broken,
 * but the only feedback that it had worked was an error page, which reads
 * exactly like a failure.
 *
 * So it redirects to the list and names what went, rather than leaving her to
 * work out whether the delete succeeded. redirect() throws NEXT_REDIRECT, so
 * it has to come after the revalidations, not inside a try.
 */
export async function deletePiece(id: string) {
  const prisma = await requireOwner();
  const deleted = await prisma.piece.delete({
    where: { id },
    select: { title: true },
  });

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  // The home page too: a deleted piece may have been in Selected work, and
  // that section would otherwise keep showing it until something else
  // revalidated.
  revalidatePath("/");

  redirect(`/admin/gallery?deleted=${encodeURIComponent(deleted.title)}`);
}

export async function addPieceImage(formData: FormData) {
  const prisma = await requireOwner();

  const alt = String(formData.get("alt") ?? "").trim();
  // Alt text is content. It is how the site gets found, and it is the only
  // thing a screen reader receives. Required here, not just in the component.
  if (alt.length < 10) {
    throw new Error(
      "Every image needs a real description, like “black and gold resin wall clock with gold Roman numerals”.",
    );
  }

  await prisma.pieceImage.create({
    data: {
      pieceId: String(formData.get("pieceId") ?? ""),
      url: String(formData.get("url") ?? ""),
      width: Number(formData.get("width") ?? 0),
      height: Number(formData.get("height") ?? 0),
      blurDataUrl: String(formData.get("blurDataUrl") ?? ""),
      alt,
      focalX: Number(formData.get("focalX") ?? 0.5),
      focalY: Number(formData.get("focalY") ?? 0.5),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
    },
  });

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function updatePieceImage(id: string, formData: FormData) {
  const prisma = await requireOwner();
  const alt = String(formData.get("alt") ?? "").trim();
  if (alt.length < 10) throw new Error("Every image needs a real description.");

  await prisma.pieceImage.update({
    where: { id },
    data: {
      alt,
      focalX: Number(formData.get("focalX") ?? 0.5),
      focalY: Number(formData.get("focalY") ?? 0.5),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
    },
  });

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function deletePieceImage(id: string) {
  const prisma = await requireOwner();
  await prisma.pieceImage.delete({ where: { id } });
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}
