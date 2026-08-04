import type { ReactElement } from "react";
import { Resend } from "resend";

/**
 * The one place a Resend client is constructed.
 *
 * There were two before, in lib/email.ts and app/admin/auth-actions.ts, each
 * with its own copy of the from address and its own error handling. They had
 * drifted, and both were wrong in the same way.
 *
 * THE IMPORTANT PART: resend.emails.send() does not throw when the API rejects
 * a send. It resolves to { data, error } and you are expected to look. Both
 * old call sites wrapped the await in try/catch and treated "did not throw" as
 * "delivered", so an unverified sending domain, a bad from address, a blown
 * quota or a rate limit would all be recorded as a success. The customer's
 * confirmation screen would say the email was on its way when Resend had
 * refused it. sendEmail() below returns a result that reflects what actually
 * happened.
 */

export const hasResend = Boolean(process.env.RESEND_API_KEY);

const client = hasResend ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Resend's sandbox sender. It needs no DNS and works the moment an API key
 * exists, but it will only deliver to the address that owns the Resend account.
 * Every other recipient is rejected outright.
 *
 * So it is a good default for testing and a bad one for launch, which is what
 * the startup warning in describeMailer() is for. The old default was
 * orders@example.com, which cannot ever deliver to anyone.
 */
const SANDBOX_FROM = "The Culture Resin <onboarding@resend.dev>";

export const FROM = process.env.EMAIL_FROM?.trim() || SANDBOX_FROM;

/**
 * Where the new-order notification goes. Hard default rather than undefined:
 * a missing environment variable should not be able to silently stop her
 * finding out that an order came in.
 */
export const OWNER_EMAIL = process.env.OWNER_EMAIL?.trim() || "amnasaqib201@gmail.com";

export const usingSandboxFrom = FROM === SANDBOX_FROM;

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; reason: string; code?: string; retryable: boolean };

/**
 * Failures worth trying again. Everything else is a configuration mistake that
 * will fail identically on the second attempt, and retrying it just adds
 * latency to a request a customer is waiting on.
 */
const RETRYABLE_CODES = new Set([
  "rate_limit_exceeded",
  "internal_server_error",
  "application_error",
]);

/** 2 requests/second on the free tier, so the first backoff clears a 429. */
const BACKOFF_MS = [600, 1800];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type SendArgs = {
  to: string;
  subject: string;
  react: ReactElement;
  /** Where a reply should land. Omitted when it would be a send-only address. */
  replyTo?: string | null;
  /**
   * Makes a retry safe. Resend keeps these for 24 hours, so a request that is
   * replayed after a timeout will not produce a second copy of the same email.
   */
  idempotencyKey?: string;
  /** Identifies the email in logs. Never shown to anyone. */
  label: string;
};

export async function sendEmail(args: SendArgs): Promise<SendResult> {
  if (!client) {
    console.info(`[email] skipped "${args.label}", RESEND_API_KEY is not set`);
    return { ok: false, reason: "RESEND_API_KEY is not set", retryable: false };
  }

  for (let attempt = 0; ; attempt++) {
    let result;
    try {
      result = await client.emails.send(
        {
          from: FROM,
          to: args.to,
          subject: args.subject,
          react: args.react,
          ...(args.replyTo ? { replyTo: args.replyTo } : {}),
        },
        args.idempotencyKey ? { idempotencyKey: args.idempotencyKey } : undefined,
      );
    } catch (e) {
      // Network level: DNS, TLS, socket timeout. Always worth one more go.
      const reason = e instanceof Error ? e.message : String(e);
      if (attempt < BACKOFF_MS.length) {
        await sleep(BACKOFF_MS[attempt]);
        continue;
      }
      console.error(`[email] "${args.label}" failed after ${attempt + 1} attempts: ${reason}`);
      return { ok: false, reason, retryable: true };
    }

    if (!result.error) {
      return { ok: true, id: result.data?.id ?? "" };
    }

    const { name: code, message, statusCode } = result.error;
    const retryable = RETRYABLE_CODES.has(code) || (statusCode !== null && statusCode >= 500);

    if (retryable && attempt < BACKOFF_MS.length) {
      await sleep(BACKOFF_MS[attempt]);
      continue;
    }

    console.error(`[email] "${args.label}" rejected by Resend [${code}]: ${message}`);
    return { ok: false, reason: message, code, retryable };
  }
}

/**
 * A one line summary of how mail is configured, for the startup log and the
 * check script. Never prints the API key.
 */
export function describeMailer(): string {
  if (!hasResend) {
    return "Email: OFF. RESEND_API_KEY is not set, so nothing will be sent.";
  }
  if (usingSandboxFrom) {
    return (
      `Email: SANDBOX. Sending as ${FROM}, which only delivers to the address ` +
      `that owns the Resend account. Verify a domain and set EMAIL_FROM before launch.`
    );
  }
  return `Email: ON. Sending as ${FROM}, owner notifications to ${OWNER_EMAIL}.`;
}
