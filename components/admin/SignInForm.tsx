"use client";

import { useActionState } from "react";
import { authButton, authInput } from "./AuthShell";
import { signInAction, type FormState } from "@/app/admin/auth-actions";

export function SignInForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signInAction, {});

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

      <label className="flex flex-col gap-2">
        <span className="eyebrow text-ink-muted">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className={authInput}
        />
      </label>

      {state.error && (
        <p role="alert" className="text-caption text-rose">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={authButton}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
