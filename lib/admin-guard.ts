import { redirect } from "next/navigation";
import { auth, authConfigured } from "@/auth";
import { getPrisma, hasDatabase } from "@/lib/db";

/**
 * The real gate for every page under /admin.
 *
 * A layout is NOT a security boundary in the App Router. Layouts and pages
 * render in parallel, so a page body runs its queries whether or not the
 * layout ends up rendering `children`, and a redirect() in the layout does not
 * stop a child page from having already hit the database. That is how the
 * dashboard managed to call prisma.order.groupBy() and throw while the layout
 * was displaying its "not switched on yet" message.
 *
 * So every admin page calls this first. Returns null when the app is not
 * configured, in which case the page renders nothing and the layout shows the
 * setup message. Redirects when there is no session.
 */
export async function getAdminPrisma() {
  if (!hasDatabase || !authConfigured) return null;

  const session = await auth();
  if (!session?.user) redirect("/admin/sign-in");

  return getPrisma();
}
