import "./env";
import { CustomerConfirmation, type SummaryRow } from "../emails/CustomerConfirmation";
import { OwnerNotification } from "../emails/OwnerNotification";
import { describeMailer, hasResend, OWNER_EMAIL, sendEmail, usingSandboxFrom } from "../lib/resend";
import { whatsappUrl } from "../lib/email";

/**
 * Sends one of each email to an address you choose, using a made-up order.
 *
 *   npm run check:email you@example.com
 *
 * The point is to see both templates in a real inbox, on a phone, in dark
 * mode, before a customer does. Nothing is written to the database and no real
 * order is involved.
 *
 * Reads its answer from Resend's response rather than from the absence of an
 * exception, which is the whole reason lib/resend.ts exists.
 */

const SAMPLE: SummaryRow[] = [
  { label: "What", value: "A wall clock" },
  { label: "Details", value: "Something like the black and gold one, but deeper green" },
  { label: "Occasion", value: "A wedding" },
  { label: "Feel", value: "Oceanic, Dramatic" },
  { label: "Lettering", value: "A & S, and the date underneath" },
  { label: "Size", value: "About 40cm across" },
  { label: "Needed by", value: "12 September 2026" },
  { label: "Where", value: "Islamabad, Pakistan" },
  { label: "Name", value: "Sample Customer" },
  { label: "WhatsApp", value: "+92 300 0000000" },
  { label: "Email", value: "sample@example.com" },
];

async function main() {
  const to = process.argv[2]?.trim();

  console.log(`\n${describeMailer()}\n`);

  if (!hasResend) process.exit(1);

  if (!to) {
    console.error("Usage: npm run check:email you@example.com\n");
    process.exit(1);
  }

  if (usingSandboxFrom) {
    console.log(
      "EMAIL_FROM is unset, so this is going out from Resend's sandbox sender.\n" +
        "It will only arrive if the address below owns the Resend account.\n" +
        "Anything else comes back as a 403 you can see at resend.com/emails.\n",
    );
  }

  const reference = "TCR-0000";

  // Her notification first, matching the order the real send path uses.
  const owner = await sendEmail({
    label: "test owner notification",
    to,
    subject: `New order · A wall clock · Sample Customer · ${reference}`,
    react: OwnerNotification({
      reference,
      name: "Sample Customer",
      productType: "A wall clock",
      rows: SAMPLE,
      adminUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin/orders/sample`,
      whatsappUrl: whatsappUrl("+92 300 0000000", "Hi Sample Customer, about TCR-0000"),
      referenceImageUrl: null,
    }),
  });

  const customer = await sendEmail({
    label: "test customer confirmation",
    to,
    replyTo: OWNER_EMAIL,
    subject: `Your order with The Culture Resin, ${reference}`,
    react: CustomerConfirmation({ reference, rows: SAMPLE }),
  });

  const report = (name: string, r: Awaited<ReturnType<typeof sendEmail>>) =>
    console.log(`  ${r.ok ? "ok  " : "FAIL"}  ${name}  ${r.ok ? r.id : r.reason}`);

  console.log(`Sent to ${to}:`);
  report("owner notification", owner);
  report("customer confirmation", customer);
  console.log("");

  if (!owner.ok || !customer.ok) {
    console.log("Delivery log and bounce reasons: https://resend.com/emails\n");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
