"use client";

import { useActionState } from "react";
import { authButton, authInput } from "./AuthShell";
import { resetPasswordAction, type FormState } from "@/app/admin/auth-actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPasswordAction, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />

      <label className="flex flex-col gap-2">
        <span className="eyebrow text-ink-muted">New password</span>
        <input
          type="password"
          name="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          autoFocus
          className={authInput}
        />
        <span className="text-caption text-ink-muted">
          At least {MIN_PASSWORD_LENGTH} characters. Long beats complicated.
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="eyebrow text-ink-muted">Again</span>
        <input
          type="password"
          name="confirm"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className={authInput}
        />
      </label>

      {state.error && (
        <p role="alert" className="text-caption text-rose">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={authButton}>
        {pending ? "Saving…" : "Save my new password"}
      </button>
    </form>
  );
}
