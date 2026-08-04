import "./env";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import { cloudinaryPublicId, hasCloudinary } from "../lib/cloudinary";

/**
 * Finds Cloudinary images that nothing in the database points at.
 *
 *   npm run cloudinary:orphans            list them
 *   npm run cloudinary:orphans -- --delete   remove them
 *
 * Deleting a piece now cleans up after itself, but that does not cover every
 * way a file can be stranded. The add-a-piece modal uploads each photograph
 * the moment it is chosen, so abandoning the modal without saving leaves those
 * uploads with nothing referencing them. Same for a failed submit. Nothing in
 * the app can find them afterwards, because the only record of the URL was the
 * form state that went away.
 *
 * Read-only unless --delete is passed. It compares against every URL column
 * that exists, so a file is only ever called an orphan when no piece image and
 * no order reference mentions it.
 */
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

async function main() {
  if (!hasCloudinary) {
    console.error("\nCloudinary is not configured. Nothing to check.\n");
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  // Every URL the database knows about, from both tables that hold one.
  const [pieceImages, orders] = await Promise.all([
    prisma.pieceImage.findMany({ select: { url: true } }),
    prisma.order.findMany({
      where: { referenceImageUrl: { not: null } },
      select: { referenceImageUrl: true },
    }),
  ]);

  const referenced = new Set<string>();
  for (const i of pieceImages) {
    const id = cloudinaryPublicId(i.url);
    if (id) referenced.add(id);
  }
  for (const o of orders) {
    const id = cloudinaryPublicId(o.referenceImageUrl ?? "");
    if (id) referenced.add(id);
  }

  // Page through everything under our own prefix. Never touches assets
  // outside tcr/, in case the account is ever shared with something else.
  const all: { public_id: string; bytes: number; created_at: string }[] = [];
  let cursor: string | undefined;
  do {
    const page = await cloudinary.api.resources({
      type: "upload",
      prefix: "tcr/",
      max_results: 100,
      next_cursor: cursor,
    });
    all.push(...page.resources);
    cursor = page.next_cursor;
  } while (cursor);

  const orphans = all.filter((r) => !referenced.has(r.public_id));

  console.log(`\n  ${all.length} images on Cloudinary under tcr/`);
  console.log(`  ${referenced.size} referenced by the database`);
  console.log(`  ${orphans.length} orphaned\n`);

  if (orphans.length === 0) {
    console.log("  Nothing to clean up.\n");
    return;
  }

  let wasted = 0;
  for (const o of orphans) {
    wasted += o.bytes;
    console.log(`    ${o.public_id}  ${(o.bytes / 1024).toFixed(0)}KB  ${o.created_at.slice(0, 10)}`);
  }
  console.log(`\n  ${(wasted / 1024 / 1024).toFixed(2)}MB wasted`);

  if (process.argv.includes("--delete")) {
    // delete_resources takes 100 ids per call.
    for (let i = 0; i < orphans.length; i += 100) {
      await cloudinary.api.delete_resources(orphans.slice(i, i + 100).map((o) => o.public_id));
    }
    console.log(`\n  Deleted ${orphans.length}.\n`);
  } else {
    console.log(`\n  Run with --delete to remove them.\n`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
