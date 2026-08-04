import "../scripts/env";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword, passwordProblem } from "../lib/password";

/**
 * Creates or updates the owner account.
 *
 *   npm run set-password <email> [password]
 *
 * With no password one is generated and printed once. Only the scrypt hash is
 * stored, so nothing here can be read back out of the database later.
 *
 * The email must also appear in ADMIN_EMAILS. This script does not touch that,
 * deliberately: creating a row should never be what grants access.
 */

// Through the session pooler rather than the transaction pooler. This runs
// once by hand, so there is nothing to gain from PgBouncer and one thing to
// lose: prepared statements, which Prisma uses and 6543 does not support.
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

/** Avoids look-alike characters, since this gets typed by hand. */
function generatePassword(length = 20): string {
  const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length * 2);
  let out = "";
  for (let i = 0; out.length < length && i < bytes.length; i++) {
    const v = bytes[i];
    // Reject above the largest exact multiple, so every character is equally likely.
    if (v < 256 - (256 % alphabet.length)) out += alphabet[v % alphabet.length];
  }
  return out;
}

async function main() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  if (!email) throw new Error("Usage: tsx prisma/set-password.ts <email> [password]");

  const supplied = process.argv[3];
  const password = supplied ?? generatePassword();

  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, failedAttempts: 0, lockedUntil: null },
    create: { email, passwordHash, name: "The Culture Resin" },
  });

  // Any outstanding reset link stops working.
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase());

  console.log(`\nOwner account ready for ${email}`);
  if (!supplied) {
    console.log(`\n  Password: ${password}\n`);
    console.log("  Shown once. Only the hash is stored. Save it somewhere safe.");
  }
  if (!allowlist.includes(email)) {
    console.log(`\n  WARNING: ${email} is not in ADMIN_EMAILS, so sign-in will still be refused.`);
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
