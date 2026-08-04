import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, authConfigured, signOut } from "@/auth";
import { hasDatabase } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Never prerendered and never cached. Every page under here is per-session and
 * reads the database, so a build-time render would both leak a stale view and
 * fail outright when DATABASE_URL is absent at build time, which it is on a
 * fresh clone.
 */
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/gallery", label: "Gallery" },
];

/**
 * The auth gate for everything under /admin except the sign-in page, which
 * sits outside this route group so it does not redirect to itself.
 *
 * Done in a layout rather than middleware because sessions are stored in the
 * database and Prisma cannot run in the Edge runtime.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasDatabase || !authConfigured) {
    return (
      <section className="mx-auto max-w-content px-6 py-section md:px-10">
        <h1 className="font-display text-display-md text-ink">The admin isn’t switched on yet.</h1>
        <p className="mt-6 max-w-prose text-body text-ink-muted">
          It needs <code className="text-ink">DATABASE_URL</code>,{" "}
          <code className="text-ink">AUTH_SECRET</code>,{" "}
          <code className="text-ink">ADMIN_EMAILS</code> and{" "}
          <code className="text-ink">RESEND_API_KEY</code> set, then{" "}
          <code className="text-ink">npx prisma migrate deploy</code>. See{" "}
          <code className="text-ink">.env.example</code>.
        </p>
      </section>
    );
  }

  const session = await auth();
  if (!session?.user) redirect("/admin/sign-in");

  return (
    <div className="mx-auto max-w-content px-6 py-16 md:px-10">
      <div className="flex flex-wrap items-baseline justify-between gap-6 border-b border-line pb-6">
        <nav className="flex gap-8">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="eyebrow text-ink-muted hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-6">
          <p className="text-caption text-ink-muted">{session.user.email}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/sign-in" });
            }}
          >
            <button type="submit" className="eyebrow text-ink-muted hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <div className="pt-12">{children}</div>
    </div>
  );
}
