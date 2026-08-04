import { CustomerConfirmation, type SummaryRow } from "@/emails/CustomerConfirmation";
import { OwnerNotification } from "@/emails/OwnerNotification";
import { OWNER_EMAIL, sendEmail } from "@/lib/resend";

export { hasResend } from "@/lib/resend";

/** Digits only, so wa.me accepts it. */
export function whatsappUrl(number: string, text?: string): string {
  const digits = number.replace(/\D/g, "");
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}

type SendArgs = {
  reference: string;
  rows: SummaryRow[];
  name: string;
  productType: string;
  email?: string | null;
  whatsapp: string;
  orderId: string;
  referenceImageUrl?: string | null;
};

export type OrderEmailResult = {
  /** Drives the success screen's wording, so it has to be the truth. */
  customerSent: boolean;
  ownerSent: boolean;
};

/**
 * Two emails per order: a branded confirmation to the customer, and the
 * working notification to her.
 *
 * Sent one after the other rather than in parallel. Resend's free tier allows
 * 2 requests per second and firing both at once sits exactly on that limit,
 * which would turn a normal order into a retry.
 *
 * Her notification goes first. If only one of the two can get through, it has
 * to be the one that tells her an order exists. The customer's copy is a
 * courtesy; the order is already saved and visible in the admin either way.
 *
 * Neither failure is allowed to fail the request. The order is in the database
 * by the time this runs, and throwing here would show the customer an error
 * for an order that was actually accepted, which would produce a duplicate.
 */
export async function sendOrderEmails(args: SendArgs): Promise<OrderEmailResult> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const owner = await sendEmail({
    label: `owner notification ${args.reference}`,
    to: OWNER_EMAIL,
    // Replying goes straight to the customer when they left an address.
    replyTo: args.email ?? undefined,
    subject: `New order · ${args.productType} · ${args.name} · ${args.reference}`,
    react: OwnerNotification({
      reference: args.reference,
      name: args.name,
      productType: args.productType,
      rows: args.rows,
      adminUrl: `${site}/admin/orders/${args.orderId}`,
      whatsappUrl: whatsappUrl(args.whatsapp, `Hi ${args.name}, about ${args.reference}`),
      referenceImageUrl: args.referenceImageUrl,
    }),
    idempotencyKey: `order-${args.orderId}-owner`,
  });

  if (!owner.ok) {
    // Loud, because this is the failure that loses her an order. The details
    // are still in the database and the admin, so this is recoverable, but
    // only if somebody notices.
    console.error(
      `[email] ORDER ${args.reference} SAVED BUT NOT NOTIFIED. ` +
        `Owner email to ${OWNER_EMAIL} failed: ${owner.reason}`,
    );
  }

  let customerSent = false;
  if (args.email) {
    const customer = await sendEmail({
      label: `customer confirmation ${args.reference}`,
      to: args.email,
      // The confirmation invites a reply, so it has to land somewhere she
      // reads rather than at the send-only from address.
      replyTo: OWNER_EMAIL,
      subject: `Your order with The Culture Resin, ${args.reference}`,
      react: CustomerConfirmation({ reference: args.reference, rows: args.rows }),
      idempotencyKey: `order-${args.orderId}-customer`,
    });
    customerSent = customer.ok;
  }

  return { customerSent, ownerSent: owner.ok };
}
