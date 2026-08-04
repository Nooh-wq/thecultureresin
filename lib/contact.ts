/**
 * The one public address on the site.
 *
 * Used by the footer's Email link and by /privacy, which promises a route for
 * data questions and deletion requests. They were separate before and the
 * footer's was an empty `mailto:`, which renders as a link that opens a blank
 * compose window addressed to nobody.
 *
 * This is her decision, not a placeholder waiting on a domain address.
 * tcr-privacy.md recommends a domain address, and the counter-argument won:
 * verifying thecultureresin.com in Resend enables sending only, so a hello@
 * would be a published address that silently receives nothing. A personal
 * inbox that works beats a branded one that does not.
 *
 * The env var still overrides it, so moving to a domain address later needs no
 * code change. Only set NEXT_PUBLIC_CONTACT_EMAIL once that mailbox actually
 * receives mail.
 */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "amnasaqib201@gmail.com";
