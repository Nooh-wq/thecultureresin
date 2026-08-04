import { NextResponse } from "next/server";
import { getPrisma, hasDatabase } from "@/lib/db";
import { sendOrderEmails } from "@/lib/email";
import { PRODUCT_TYPES } from "@/lib/order-config";
import { formatReference, orderSchema } from "@/lib/order-schema";
import { getPiece } from "@/lib/gallery";
import { checkRateLimit } from "@/lib/rate-limit";
import type { SummaryRow } from "@/emails/CustomerConfirmation";

const REFERENCE_TYPE = {
  gallery: "GALLERY_PIECE",
  picture: "UPLOADED_IMAGE",
  new: "NONE",
} as const;

const VIBE_VALUES = new Set([
  "OCEANIC",
  "BOTANICAL",
  "DRAMATIC",
  "SOFT",
  "MINIMAL",
  "PLAYFUL",
  "TRADITIONAL",
]);

/** "Oceanic" from the form to the OCEANIC enum member. Unknown values are dropped. */
function toVibeEnum(vibes: string[]) {
  return vibes
    .map((v) => v.trim().toUpperCase().replace(/\s+/g, "_"))
    .filter((v) => VIBE_VALUES.has(v)) as never[];
}

function buildSummary(
  d: ReturnType<typeof orderSchema.parse>,
  pieceTitle?: string,
): SummaryRow[] {
  const label =
    PRODUCT_TYPES.find((p) => p.value === d.productType)?.label ?? d.productType;

  const rows: [string, string | null | undefined][] = [
    ["What", label],
    ["Details", d.productDetail],
    ["Starting from", pieceTitle],
    ["Occasion", d.occasion],
    ["Feel", d.vibes.length ? d.vibes.join(", ") : null],
    ["Lettering", d.lettering],
    ["Size", d.size],
    ["Needed by", d.neededBy],
    ["Budget", d.budget],
    ["Where", [d.city, d.country].filter(Boolean).join(", ")],
    ["Name", d.name],
    ["WhatsApp", d.whatsapp],
    ["Email", d.email],
    ["Notes", d.notes],
  ];

  return rows
    .filter(([, v]) => Boolean(v && String(v).trim()))
    .map(([label, value]) => ({ label, value: String(value) }));
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "That didn’t send. Try again." }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Some answers need another look.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const data = parsed.data;

  // Honeypot. Silently accept so a bot learns nothing from the response.
  if (data.website) {
    return NextResponse.json({ reference: formatReference(0), emailed: false });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { ok } = await checkRateLimit("order", ip);
  if (!ok) {
    return NextResponse.json(
      { error: "That’s a few too many in a row. Try again in a little while." },
      { status: 429 },
    );
  }

  const piece = data.referencePieceSlug ? await getPiece(data.referencePieceSlug) : undefined;
  const rows = buildSummary(data, piece?.title);
  const productLabel =
    PRODUCT_TYPES.find((p) => p.value === data.productType)?.label ?? data.productType;

  // ---------------------------------------------------------------------
  // No database yet. In development this still exercises the whole flow so
  // the form and the success state can be reviewed; in production it is a
  // hard failure, because silently dropping an order is the worst outcome
  // available.
  // ---------------------------------------------------------------------
  if (!hasDatabase) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "That didn’t send. Try again." },
        { status: 503 },
      );
    }
    console.info("[order] DRY RUN, no DATABASE_URL set:", JSON.stringify(rows, null, 2));
    return NextResponse.json({ reference: formatReference(41), emailed: false, dryRun: true });
  }

  try {
    const prisma = getPrisma();

    const order = await prisma.order.create({
      data: {
        productType: data.productType,
        productDetail: data.productDetail || null,
        referenceType: REFERENCE_TYPE[data.referenceType ?? "new"],
        referenceImageUrl: data.referenceImageUrl || null,
        occasion: data.occasion || null,
        vibes: toVibeEnum(data.vibes),
        lettering: data.lettering || null,
        size: data.size || null,
        neededBy: data.neededBy ? new Date(data.neededBy) : null,
        budgetBand: data.budget || null,
        country: data.country,
        city: data.city || null,
        name: data.name,
        whatsapp: data.whatsapp,
        email: data.email || null,
        notes: data.notes || null,
        ...(piece ? { referencePiece: { connect: { slug: piece.slug } } } : {}),
      },
      select: { id: true, reference: true },
    });

    const reference = formatReference(order.reference);
    const { customerSent } = await sendOrderEmails({
      reference,
      rows,
      name: data.name,
      productType: productLabel,
      email: data.email || null,
      whatsapp: data.whatsapp,
      orderId: order.id,
      referenceImageUrl: data.referenceImageUrl || null,
    });

    return NextResponse.json({ reference, emailed: customerSent });
  } catch (e) {
    console.error("[order] create failed", e);
    return NextResponse.json(
      { error: "That didn’t send. Try again." },
      { status: 500 },
    );
  }
}
