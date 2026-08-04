/**
 * The gallery's content.
 *
 * This is a local module rather than a Prisma query on purpose: there is no
 * Neon connection string yet, and the site needs to run without one. The shape
 * matches prisma/schema.prisma exactly, so swapping this for a real query is a
 * mechanical change in one place (getPieces / getPiece below).
 *
 * Every image here is an unedited photograph of the real piece. Only the hero
 * is AI-edited. See CLAUDE.md section 2.
 */

export const CATEGORIES = [
  "Clocks",
  "Tables",
  "Trays",
  "Wall art",
  "Jewellery",
  "Keepsakes",
] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * Seven vibes. The order form offers all seven; tcr-copy.md's gallery filter
 * row lists only the first five. Both read from this one list so the taxonomy
 * cannot drift apart. GALLERY_VIBES is what the filter row renders.
 */
export const VIBES = [
  "Oceanic",
  "Botanical",
  "Dramatic",
  "Soft",
  "Minimal",
  "Playful",
  "Traditional",
] as const;

export type Vibe = (typeof VIBES)[number];

export const GALLERY_VIBES: readonly Vibe[] = [
  "Oceanic",
  "Botanical",
  "Dramatic",
  "Soft",
  "Minimal",
];

export type PieceImage = {
  src: string;
  /** Required. Never "resin art 4". A real description, for search and for screen readers. */
  alt: string;
  width: number;
  height: number;
  /** 0..1 fractions. Decides what survives a fixed-ratio crop in the grid. */
  focalX: number;
  focalY: number;
  /** Present on database images. Local seeded files use the generated table. */
  blurDataUrl?: string;
};

/** CSS object-position for a focal point. */
export function focalPosition(img: Pick<PieceImage, "focalX" | "focalY">): string {
  return `${img.focalX * 100}% ${img.focalY * 100}%`;
}

export type Piece = {
  slug: string;
  title: string;
  category: Category;
  vibes: Vibe[];
  images: PieceImage[];
  /** Her words, max 140 characters. Null until she writes it. Nothing invented. */
  storyNote: string | null;
  dimensions: string | null;
  materials: string | null;
  leadTime: string | null;
  /** Featured pieces appear in Home's Selected work section, lowest order first. */
  featuredOrder: number | null;
};

export const PIECES: Piece[] = [
  {
    slug: "black-and-gold-clock",
    title: "Black and gold clock",
    category: "Clocks",
    vibes: ["Dramatic", "Minimal"],
    images: [
      {
        src: "/images/pieces/black-gold-wall-clock.jpg",
        alt: "Round black resin wall clock with gold marbled veining, raised black crystal clusters at two edges and gold Roman numerals",
        width: 1440,
        height: 1440,
        focalX: 0.5,
        focalY: 0.5,
      },
    ],
    storyNote: null,
    dimensions: null,
    materials: null,
    leadTime: null,
    featuredOrder: 1,
  },
  {
    slug: "teal-wave-tray",
    title: "Teal wave tray",
    category: "Trays",
    vibes: ["Oceanic", "Dramatic"],
    images: [
      {
        src: "/images/pieces/teal-serving-tray.jpg",
        alt: "Wave-edged teal resin serving tray with a swirled pearlescent surface, clear crystal chips along two edges and black and gold handles",
        width: 1440,
        height: 1440,
        focalX: 0.5,
        focalY: 0.5,
      },
    ],
    storyNote: null,
    dimensions: null,
    materials: null,
    leadTime: null,
    featuredOrder: 2,
  },
  {
    slug: "rose-disc",
    title: "Rose disc",
    category: "Keepsakes",
    vibes: ["Soft", "Botanical"],
    images: [
      {
        src: "/images/pieces/rose-keepsake-disc.jpg",
        alt: "Round translucent resin disc holding a single dried red rose on its stem, with scattered gold leaf along the lower edge",
        width: 1402,
        height: 1401,
        focalX: 0.5,
        focalY: 0.5,
      },
    ],
    storyNote: null,
    dimensions: null,
    materials: null,
    leadTime: null,
    featuredOrder: 3,
  },
  {
    slug: "daisy-drop-earrings",
    title: "Daisy drop earrings",
    category: "Jewellery",
    vibes: ["Botanical", "Traditional"],
    images: [
      {
        src: "/images/pieces/daisy-silver-earrings.jpg",
        alt: "Pair of oxidised silver drop earrings with bead fringe, each set with a deep blue resin panel holding a pressed white daisy",
        width: 1080,
        height: 1440,
        focalX: 0.5,
        focalY: 0.5,
      },
    ],
    storyNote: null,
    dimensions: null,
    materials: null,
    leadTime: null,
    featuredOrder: 4,
  },
  {
    slug: "pink-geode-clock",
    title: "Pink geode clock",
    category: "Clocks",
    vibes: ["Soft", "Dramatic"],
    images: [
      {
        src: "/images/pieces/pink-geode-wall-clock.jpg",
        alt: "Round resin wall clock in cream and pink with a crushed pink stone geode edge and gold Roman numerals",
        width: 1440,
        height: 1800,
        focalX: 0.5,
        focalY: 0.5,
      },
    ],
    storyNote: null,
    dimensions: null,
    materials: null,
    leadTime: null,
    featuredOrder: null,
  },
  {
    slug: "leaf-platter",
    title: "Leaf platter",
    category: "Trays",
    vibes: ["Botanical", "Dramatic"],
    images: [
      {
        src: "/images/pieces/leaf-platter.jpg",
        alt: "Long leaf-shaped resin platter in dark teal with a gold and silver vein running down the centre and a gilded edge",
        width: 1440,
        height: 1800,
        focalX: 0.5,
        focalY: 0.5,
      },
    ],
    storyNote: null,
    dimensions: null,
    materials: null,
    leadTime: null,
    featuredOrder: null,
  },
  {
    slug: "forget-me-not-pendant",
    title: "Forget-me-not pendant",
    category: "Jewellery",
    vibes: ["Botanical", "Soft"],
    images: [
      {
        src: "/images/pieces/forget-me-not-pendant.jpg",
        alt: "Round gold pendant holding a single pressed blue forget-me-not on a pearl white ground, ringed with small clear crystals, on a fine gold chain",
        width: 1080,
        height: 1440,
        focalX: 0.5,
        focalY: 0.5,
      },
    ],
    storyNote: null,
    dimensions: null,
    materials: null,
    leadTime: null,
    featuredOrder: null,
  },
  {
    slug: "heart-pendants",
    title: "Heart pendants",
    category: "Jewellery",
    vibes: ["Soft", "Botanical"],
    images: [
      {
        src: "/images/pieces/heart-pendants.jpg",
        alt: "Two small gold heart pendants on fine chains, one deep red with gold leaf inside and one navy blue with pressed white flowers",
        width: 1440,
        height: 1800,
        focalX: 0.5,
        focalY: 0.5,
      },
    ],
    storyNote: null,
    dimensions: null,
    materials: null,
    leadTime: null,
    featuredOrder: null,
  },
];

export function getPieces(): Piece[] {
  return PIECES;
}

export function getPiece(slug: string): Piece | undefined {
  return PIECES.find((p) => p.slug === slug);
}

export function getFeaturedPieces(): Piece[] {
  return PIECES.filter((p) => p.featuredOrder !== null).sort(
    (a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0),
  );
}

/** Categories that actually have work in them. */
export function getUsedCategories(): Category[] {
  return CATEGORIES.filter((c) => PIECES.some((p) => p.category === c));
}

