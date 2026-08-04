import { getPrisma, hasDatabase } from "./db";
import {
  CATEGORIES,
  PIECES,
  type Category,
  type Piece,
  type Vibe,
} from "./pieces";

/**
 * The public site's view of the gallery.
 *
 * Reads the database when there is one, and falls back to the static list in
 * lib/pieces.ts when there isn't, so the site still runs on a fresh clone with
 * no DATABASE_URL.
 *
 * This exists because the public pages used to read the static list directly,
 * which meant nothing the owner changed in the admin ever reached the site:
 * not a new piece, not a reordering, not the focal point.
 */

const CATEGORY_FROM_DB: Record<string, Category> = {
  CLOCKS: "Clocks",
  TABLES: "Tables",
  TRAYS: "Trays",
  WALL_ART: "Wall art",
  JEWELLERY: "Jewellery",
  KEEPSAKES: "Keepsakes",
};

const VIBE_FROM_DB: Record<string, Vibe> = {
  OCEANIC: "Oceanic",
  BOTANICAL: "Botanical",
  DRAMATIC: "Dramatic",
  SOFT: "Soft",
  MINIMAL: "Minimal",
  PLAYFUL: "Playful",
  TRADITIONAL: "Traditional",
};

export const CATEGORY_TO_DB: Record<Category, string> = {
  Clocks: "CLOCKS",
  Tables: "TABLES",
  Trays: "TRAYS",
  "Wall art": "WALL_ART",
  Jewellery: "JEWELLERY",
  Keepsakes: "KEEPSAKES",
};

/** Explicit select. Nothing private lives on Piece, but the habit is cheap. */
const pieceSelect = {
  slug: true,
  title: true,
  category: true,
  vibes: true,
  storyNote: true,
  dimensions: true,
  materials: true,
  leadTime: true,
  featuredOrder: true,
  images: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      url: true,
      alt: true,
      width: true,
      height: true,
      focalX: true,
      focalY: true,
      blurDataUrl: true,
    },
  },
} as const;

type DbPiece = {
  slug: string;
  title: string;
  category: string;
  vibes: string[];
  storyNote: string | null;
  dimensions: string | null;
  materials: string | null;
  leadTime: string | null;
  featuredOrder: number | null;
  images: {
    url: string;
    alt: string;
    width: number;
    height: number;
    focalX: number;
    focalY: number;
    blurDataUrl: string;
  }[];
};

function toPiece(p: DbPiece): Piece {
  return {
    slug: p.slug,
    title: p.title,
    category: CATEGORY_FROM_DB[p.category] ?? "Keepsakes",
    vibes: p.vibes.map((v) => VIBE_FROM_DB[v]).filter(Boolean),
    storyNote: p.storyNote,
    dimensions: p.dimensions,
    materials: p.materials,
    leadTime: p.leadTime,
    featuredOrder: p.featuredOrder,
    images: p.images.map((i) => ({
      src: i.url,
      alt: i.alt,
      width: i.width,
      height: i.height,
      focalX: i.focalX,
      focalY: i.focalY,
      blurDataUrl: i.blurDataUrl || undefined,
    })),
  };
}

export async function getPieces(): Promise<Piece[]> {
  if (!hasDatabase) return PIECES;
  try {
    const rows = await getPrisma().piece.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: pieceSelect,
    });
    return rows.map((r) => toPiece(r as DbPiece));
  } catch {
    // A database that is configured but unreachable should not take the
    // portfolio down. Fall back to what shipped in the repo.
    return PIECES;
  }
}

export async function getPiece(slug: string): Promise<Piece | undefined> {
  if (!hasDatabase) return PIECES.find((p) => p.slug === slug);
  try {
    const row = await getPrisma().piece.findFirst({
      where: { slug, published: true },
      select: pieceSelect,
    });
    if (!row) return undefined;
    return toPiece(row as DbPiece);
  } catch {
    return PIECES.find((p) => p.slug === slug);
  }
}

export async function getFeaturedPieces(): Promise<Piece[]> {
  const all = await getPieces();
  return all
    .filter((p) => p.featuredOrder !== null)
    .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));
}

/** Only categories that actually have work in them. Empty chips lead nowhere. */
export async function getUsedCategories(): Promise<Category[]> {
  const all = await getPieces();
  return CATEGORIES.filter((c) => all.some((p) => p.category === c));
}
