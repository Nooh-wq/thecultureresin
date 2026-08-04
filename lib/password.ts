import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";

/**
 * Password hashing with scrypt from node:crypto.
 *
 * scrypt rather than a plain hash because it is deliberately slow and
 * memory-hard, which is the only thing that makes an offline attack on a
 * stolen hash expensive. No dependency needed, and nothing native to fail to
 * build on Windows.
 *
 * Stored format: scrypt$N$r$p$salt$key, salt and key base64. The parameters
 * travel with the hash so they can be raised later without invalidating
 * existing passwords.
 */

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;
const SALT_BYTES = 16;

function scrypt(password: string, salt: Buffer, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    _scrypt(
      password.normalize("NFKC"),
      salt,
      keylen,
      { N, r: R, p: P, maxmem: 64 * 1024 * 1024 },
      (err, key) => (err ? reject(err) : resolve(key as Buffer)),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(password, salt, KEYLEN);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const salt = Buffer.from(parts[4], "base64");
  const expected = Buffer.from(parts[5], "base64");
  const actual = await scrypt(password, salt, expected.length);

  // Constant time. A plain === leaks how much of the hash matched.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Reset tokens are stored hashed, so the table is useless to anyone who reads
 * it. SHA-256 is right here rather than scrypt: the token already has 256 bits
 * of entropy, so there is nothing to brute force and no reason to be slow.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newResetToken(): string {
  return randomBytes(32).toString("hex");
}

// Rules live in lib/password-rules.ts so client components can import them
// without dragging node:crypto into the browser bundle.
export { MIN_PASSWORD_LENGTH, passwordProblem } from "./password-rules";
