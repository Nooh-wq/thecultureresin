/**
 * Password rules, deliberately in their own module with no imports.
 *
 * The reset form is a client component and needs the minimum length to render
 * its own validation. Pulling that from lib/password.ts dragged node:crypto
 * into the browser bundle, which webpack cannot resolve and which failed the
 * whole route. Rules here, hashing there.
 */

/** Long beats complicated, and she has to type this. */
export const MIN_PASSWORD_LENGTH = 12;

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `That needs to be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > 200) return "That is too long.";
  return null;
}
