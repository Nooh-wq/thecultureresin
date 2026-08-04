import "../scripts/env";
import { PrismaClient } from "@prisma/client";
import { BLUR_DATA } from "../lib/blur-data";
import { PIECES } from "../lib/pieces";

/**
 * Seeds the eight real photographs into the database.
 *
 * Run once the Supabase URLs exist:
 *   npm run db:deploy
 *   npm run db:seed
 *
 * Upserts by slug, so running it twice is safe and will not duplicate a piece.
 *
 * Story notes, dimensions, materials and lead times are null on every piece
 * because she has not written them. They stay null here rather than being
 * filled with plausible text.
 */

// The session pooler, for the same reason as set-password.ts: this is a
// one-off script and the transaction pooler cannot do prepared statements.
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

const CATEGORY: Record<string, string> = {
  Clocks: "CLOCKS",
  Tables: "TABLES",
  Trays: "TRAYS",
  "Wall art": "WALL_ART",
  Jewellery: "JEWELLERY",
  Keepsakes: "KEEPSAKES",
};

async function main() {
  for (const [i, p] of PIECES.entries()) {
    const piece = await prisma.piece.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        title: p.title,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: CATEGORY[p.category] as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vibes: p.vibes.map((v) => v.toUpperCase().replace(/\s+/g, "_")) as any,
        storyNote: p.storyNote,
        dimensions: p.dimensions,
        materials: p.materials,
        leadTime: p.leadTime,
        featuredOrder: p.featuredOrder,
        published: true,
        sortOrder: i,
      },
    });

    for (const [j, img] of p.images.entries()) {
      const exists = await prisma.pieceImage.findFirst({
        where: { pieceId: piece.id, url: img.src },
      });
      if (exists) continue;

      await prisma.pieceImage.create({
        data: {
          pieceId: piece.id,
          url: img.src,
          alt: img.alt,
          width: img.width,
          height: img.height,
          blurDataUrl: BLUR_DATA[img.src] ?? "",
          sortOrder: j,
        },
      });
    }
  }

  const count = await prisma.piece.count();
  console.log(`Seeded. ${count} pieces in the database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
