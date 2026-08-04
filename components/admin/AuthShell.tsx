import Link from "next/link";

/** Shared frame for sign in, forgot password and reset. */
export function AuthShell({
  title,
  intro,
  children,
  footer,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 pt-10 md:px-12">
        <Link
          href="/"
          className="font-display text-[1.25rem] leading-none tracking-eyebrow text-ink"
          aria-label="The Culture Resin, home"
        >
          TCR
        </Link>
      </header>

      <main className="flex flex-1 items-center px-6 py-16 md:px-12">
        <div className="mx-auto w-full max-w-md">
          <h1 className="font-display text-display-lg text-ink">{title}</h1>
          {intro && <p className="mt-4 text-body text-ink-muted">{intro}</p>}
          <div className="mt-10">{children}</div>
          {footer && <div className="mt-8">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export const authInput =
  "w-full rounded-control border border-line bg-surface px-5 py-4 text-body text-ink " +
  "placeholder:text-ink-muted focus:border-rose focus:outline-none transition-colors duration-200";

export const authButton =
  "eyebrow w-full rounded-control bg-ink px-6 py-4 text-canvas transition-opacity " +
  "duration-200 hover:opacity-85 disabled:opacity-60";
