import { z } from "zod";

/**
 * One schema, used by the form on the client and by /api/order on the server.
 *
 * Messages are taken verbatim from tcr-copy.md's error table. Errors explain
 * what happened and how to fix it. They don't apologise and they're never
 * vague.
 *
 * FLAGGED, NOT CHANGED: the WhatsApp message says "Include your city code, or
 * start with +92." Pakistani mobiles are 03xx, so "city code" describes a
 * landline, and "+92" is the wrong instruction for the US, Canada, Europe and
 * Gulf customers this business explicitly serves. Left verbatim per CLAUDE.md
 * section 8. Worth rewriting.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+]?[\d][\d\s\-()]{6,20}$/;

export const orderSchema = z.object({
  productType: z.string().min(1, "Pick one so I know where to start."),
  productDetail: z.string().max(500).optional().or(z.literal("")),

  referenceType: z.enum(["gallery", "picture", "new"]).optional(),
  referencePieceSlug: z.string().optional().or(z.literal("")),
  referenceImageUrl: z.string().optional().or(z.literal("")),

  occasion: z.string().optional().or(z.literal("")),
  vibes: z.array(z.string()).default([]),

  lettering: z.string().max(200).optional().or(z.literal("")),
  size: z.string().optional().or(z.literal("")),
  neededBy: z.string().optional().or(z.literal("")),
  budget: z.string().max(120).optional().or(z.literal("")),

  country: z.string().min(1, "Pick where you are so I can work out delivery."),
  city: z.string().max(120).optional().or(z.literal("")),

  name: z.string().trim().min(1, "I’ll need a name to reply to."),
  whatsapp: z
    .string()
    .trim()
    .min(1, "I’ll need a number to reply to.")
    .refine(
      (v) => PHONE_RE.test(v),
      "That doesn’t look right. Include your city code, or start with +92.",
    ),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || EMAIL_RE.test(v),
      "That email address doesn’t look complete.",
    ),

  notes: z.string().max(2000).optional().or(z.literal("")),

  /**
   * Honeypot. Hidden and off the tab order, so real people never fill it.
   *
   * Deliberately NOT validated. If the schema rejected a filled honeypot the
   * response would be a 422 naming the `website` field, which tells a bot
   * exactly which input to leave alone next time. The route accepts it and
   * returns an ordinary-looking success instead.
   */
  website: z.string().optional().or(z.literal("")),
});

export type OrderInput = z.infer<typeof orderSchema>;

/** TCR-0041. Four digits, zero padded, growing past four when it needs to. */
export function formatReference(n: number): string {
  return `TCR-${String(n).padStart(4, "0")}`;
}
