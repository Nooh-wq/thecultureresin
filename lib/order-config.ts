/**
 * Everything the order form needs to render its options.
 *
 * THREE FIELDS ARE DELIBERATELY EMPTY. tcr-copy.md specifies that field 6
 * shows "a real-world reference for the product type chosen", field 7 shows
 * "[Category] usually takes [lead time]", and field 8 scales budget ranges to
 * the product type. None of those values exist in either source document, and
 * inventing a lead time or a price band would be worse than leaving them out:
 * one is a promise about her time, the other anchors expectations exactly the
 * way a price would.
 *
 * So the mechanism is built and the values are blank. The UI omits any helper
 * line with no value behind it, and the budget field falls back to free text
 * until real bands exist. Fill these in with her and nothing else changes.
 */

export const PRODUCT_TYPES = [
  { value: "wall-clock", label: "Wall clock" },
  { value: "table", label: "Table or furniture" },
  { value: "wall-art", label: "Wall art" },
  { value: "jewellery", label: "Jewellery" },
  { value: "keepsake", label: "Nameplate or keepsake" },
  { value: "other", label: "Something else" },
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number]["value"];

/** "wall-clock" to "Wall clock". The admin and the emails both read better for it. */
export function productLabel(value: string): string {
  return PRODUCT_TYPES.find((p) => p.value === value)?.label ?? value;
}

export const REFERENCE_CHOICES = [
  { value: "gallery", label: "I saw something in the gallery" },
  { value: "picture", label: "I have a picture to show you" },
  { value: "new", label: "It’s completely new" },
] as const;

export const OCCASIONS = [
  "Wedding",
  "Birthday",
  "Anniversary",
  "New baby",
  "Housewarming",
  "For myself",
  "Something else",
] as const;

export const SIZES = ["Small", "Medium", "Large", "Not sure yet"] as const;

/** She ships to the US, Canada, Europe and the Gulf, so this cannot be a Pakistani city list. */
export const COUNTRIES = [
  "Pakistan",
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Somewhere else",
] as const;

/** Typing either of these into the city field offers collection. */
export const COLLECTION_CITIES = ["islamabad", "rawalpindi"];

type ProductConfig = {
  /** e.g. "about three weeks". Renders field 7's helper line. Null hides it. */
  leadTime: string | null;
  /** e.g. ["Under 10,000", "10,000 to 25,000"]. Empty falls back to a text input. */
  budgetBands: string[];
  /** Small/Medium/Large to a real object, e.g. "about the size of a dinner plate". */
  sizeReferences: Partial<Record<(typeof SIZES)[number], string>>;
};

const EMPTY: ProductConfig = { leadTime: null, budgetBands: [], sizeReferences: {} };

export const PRODUCT_CONFIG: Record<ProductType, ProductConfig> = {
  "wall-clock": { ...EMPTY },
  table: { ...EMPTY },
  "wall-art": { ...EMPTY },
  jewellery: { ...EMPTY },
  keepsake: { ...EMPTY },
  other: { ...EMPTY },
};

export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

/**
 * iPhones shoot HEIC by default and most traffic arrives from an Instagram bio
 * link, so restricting to JPG and PNG alone would reject a large share of real
 * uploads. Cloudinary converts HEIC on the way in.
 */
export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];
