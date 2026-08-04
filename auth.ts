import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getPrisma, hasDatabase } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

/**
 * Owner auth. Email and password, no public sign-up, one account.
 *
 * Three gates, not one:
 *   1. ADMIN_EMAILS allowlist, checked before the password is even looked at
 *   2. The password itself, scrypt verified in constant time
 *   3. A per-account lockout after repeated failures
 *
 * Sessions are JWT rather than database rows. That is forced by the Credentials
 * provider: the Prisma adapter does not create a Session row for a credentials
 * sign-in, so a database strategy would authenticate and then immediately have
 * no session. The adapter stays for the User table.
 */

const allowlist = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const MAX_ATTEMPTS = 8;
const LOCK_MINUTES = 15;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: hasDatabase ? PrismaAdapter(getPrisma()) : undefined,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  trustHost: true,
  pages: { signIn: "/admin/sign-in" },
  providers: [
    Credentials({
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const email = String(raw?.email ?? "").trim().toLowerCase();
        const password = String(raw?.password ?? "");
        if (!email || !password) return null;

        // Not on the allowlist: never touch the database, never reveal more.
        if (!allowlist.includes(email)) return null;
        if (!hasDatabase) return null;

        const prisma = getPrisma();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        if (user.lockedUntil && user.lockedUntil > new Date()) return null;

        const ok = await verifyPassword(password, user.passwordHash);

        if (!ok) {
          const attempts = user.failedAttempts + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedAttempts: attempts,
              lockedUntil:
                attempts >= MAX_ATTEMPTS
                  ? new Date(Date.now() + LOCK_MINUTES * 60_000)
                  : null,
            },
          });
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { failedAttempts: 0, lockedUntil: null },
        });

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    /**
     * Re-checks the allowlist on every request, not just at sign-in.
     *
     * This used to be `return token` under a comment claiming it refused
     * tokens whose address had been removed from the allowlist. It did not do
     * that. The signIn callback below runs once, when the session is created,
     * so taking an address out of ADMIN_EMAILS left any token it had already
     * been issued working for the rest of its seven day life. Revoking access
     * meant rotating AUTH_SECRET and signing everyone out.
     *
     * Returning null invalidates the session, which is what the comment always
     * claimed and now what the code does.
     */
    jwt({ token }) {
      const email = token.email?.toLowerCase();
      if (!email || !allowlist.includes(email)) return null;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
    signIn({ user }) {
      const email = user.email?.toLowerCase();
      return Boolean(email && allowlist.includes(email));
    },
  },
});

export const authConfigured =
  hasDatabase && allowlist.length > 0 && Boolean(process.env.AUTH_SECRET);

export const adminAllowlist = allowlist;
export const LOCKOUT = { MAX_ATTEMPTS, LOCK_MINUTES };
