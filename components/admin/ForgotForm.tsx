"use client";

import { useActionState } from "react";
import { authButton, authInput } from "./AuthShell";
import { requestResetAction, type FormState } from "@/app/admin/auth-actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestResetAction, {});

  if (state.done) {
    return (
      <p className="text-body text-ink-muted">
        If that address can sign in here, a link is on its way. It works once and expires in an
        hour.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="eyebrow text-ink-muted">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          autoFocus
          className={authInput}
        />
      </label>

      {state.error && (
        <p role="alert" className="text-caption text-rose">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={authButton}>
        {pending ? "Sending…" : "Send me a link"}
      </button>
    </form>
  );
}
