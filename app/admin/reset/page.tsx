import Link from "next/link";
import { AuthShell } from "@/components/admin/AuthShell";
import { ResetForm } from "@/components/admin/ResetForm";
import { getPrisma, hasDatabase } from "@/lib/db";
import { hashToken } from "@/lib/password";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * The token is checked here before the form is shown, so a dead link says so
 * immediately rather than after someone has typed a new password twice.
 * It is checked again on submit, because this render proves nothing.
 */
export default async function Reset({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let valid = false;
  if (token && hasDatabase) {
    const row = await getPrisma().passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { usedAt: true, expiresAt: true },
    });
    valid = Boolean(row && !row.usedAt && row.expiresAt > new Date());
  }

  if (!valid) {
    return (
      <AuthShell
        title="That link doesn’t work."
        intro="It has expired, or it has already been used. Links last an hour and work once."
        footer={
          <Link href="/admin/forgot" className="eyebrow text-ink-muted hover:text-ink">
            Ask for a new one
          </Link>
        }
      >
        <span />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password">
      <ResetForm token={token as string} />
    </AuthShell>
  );
}
