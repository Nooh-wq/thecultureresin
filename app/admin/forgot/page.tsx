import Link from "next/link";
import { AuthShell } from "@/components/admin/AuthShell";
import { ForgotForm } from "@/components/admin/ForgotForm";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function Forgot() {
  return (
    <AuthShell
      title="Forgot your password?"
      intro="Tell me the address you sign in with and I’ll send you a link to set a new one."
      footer={
        <Link href="/admin/sign-in" className="eyebrow text-ink-muted hover:text-ink">
          Back to sign in
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
