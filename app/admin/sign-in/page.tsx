import Link from "next/link";
import { authConfigured } from "@/auth";
import { AuthShell } from "@/components/admin/AuthShell";
import { SignInForm } from "@/components/admin/SignInForm";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;

  if (!authConfigured) {
    return (
      <AuthShell title="Sign-in isn’t switched on yet.">
        <p className="text-body text-ink-muted">
          Set <code className="text-ink">DATABASE_URL</code>,{" "}
          <code className="text-ink">AUTH_SECRET</code> and{" "}
          <code className="text-ink">ADMIN_EMAILS</code>, then create the owner account with{" "}
          <code className="text-ink">npx tsx prisma/set-password.ts</code>.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Sign in"
      intro={reset ? undefined : "This is only for the owner of the site."}
      footer={
        <Link href="/admin/forgot" className="eyebrow text-ink-muted hover:text-ink">
          Forgot your password?
        </Link>
      }
    >
      {reset && (
        <p className="mb-8 text-body text-ink">
          Your password has been changed. Sign in with the new one.
        </p>
      )}
      <SignInForm />
    </AuthShell>
  );
}
