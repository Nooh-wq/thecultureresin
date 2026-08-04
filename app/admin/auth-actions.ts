"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminAllowlist, signIn } from "@/auth";
import { PasswordReset } from "@/emails/PasswordReset";
import { getPrisma, hasDatabase } from "@/lib/db";
import { hashPassword, hashToken, newResetToken } from "@/lib/password";
import { passwordProblem } from "@/lib/password-rules";
import { checkRateLimit } from "@/lib/rate-limit";
import { hasResend, sendEmail } from "@/lib/resend";

export type FormState = { error?: string; done?: boolean };

const RESET_MINUTES = 60;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

// ---------------------------------------------------------------------------
// Sign in
// ---------------------------------------------------------------------------

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const { ok } = await checkRateLimit("signin", await clientIp());
  if (!ok) return { error: "Too many attempts. Wait a few minutes and try again." };

  try {
    await signIn("credentials", { email, password, redirectTo: "/admin" });
  } catch (e) {
    // A successful sign-in throws NEXT_REDIRECT, which has to propagate.
    if (e instanceof AuthError) {
      // Deliberately one message for every failure. Saying "no such account"
      // or "wrong password" tells an attacker which half they got right.
      return { error: "That email and password don’t match." };
    }
    throw e;
  }

  return {};
}

// ---------------------------------------------------------------------------
// Forgot password
// ---------------------------------------------------------------------------

export async function requestResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const { ok } = await checkRateLimit("reset", await clientIp());
  // Even the rate-limited response looks identical, so probing tells nothing.
  if (!ok || !email || !hasDatabase) return { done: true };

  // Only ever for an allowlisted owner address.
  if (adminAllowlist.includes(email)) {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Any earlier outstanding link stops working the moment a new one is asked for.
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

      const token = newResetToken();
      await prisma.passwordResetToken.create({
        data: {
          tokenHash: hashToken(token),
          userId: user.id,
          expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000),
        },
      });

      const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const url = `${site}/admin/reset?token=${token}`;

      if (hasResend) {
        // sendEmail reports a rejection rather than swallowing it, so a reset
        // link that Resend refused shows up in the logs instead of looking
        // like a delivery that quietly went missing.
        await sendEmail({
          label: `password reset ${email}`,
          to: email,
          subject: "Set a new password for The Culture Resin",
          react: PasswordReset({ url, minutes: RESET_MINUTES }),
          // Keyed on this request's own token, not on the address. Asking for
          // a second link generates a fresh token and so a fresh key, which is
          // what we want: keying on the email would make Resend treat the new
          // link as a duplicate and never send it.
          idempotencyKey: `reset-${hashToken(token)}`,
        });
      } else {
        // Development with no mail provider. The token is still real and still
        // verified; only the delivery channel changes.
        console.log(
          `\n────────────────────────────────────────\n[auth] Password reset for ${email}\n${url}\n────────────────────────────────────────\n`,
        );
      }
    }
  }

  // Same answer whether or not that address exists.
  return { done: true };
}

// ---------------------------------------------------------------------------
// Set a new password
// ---------------------------------------------------------------------------

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) return { error: "That link is not valid. Ask for a new one." };
  if (password !== confirm) return { error: "Those two passwords aren’t the same." };

  const problem = passwordProblem(password);
  if (problem) return { error: problem };

  if (!hasDatabase) return { error: "That didn’t work. Try again." };

  const prisma = getPrisma();
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { error: "That link has expired or has already been used. Ask for a new one." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      // Setting a new password also clears any lockout.
      data: {
        passwordHash: await hashPassword(password),
        failedAttempts: 0,
        lockedUntil: null,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: row.userId, usedAt: null },
    }),
  ]);

  redirect("/admin/sign-in?reset=1");
}
