"use client";

/**
 * Option cards for the order flow.
 *
 * Deliberately large. One question owns the whole screen, so these are the
 * only thing to aim at, and most people are answering on a phone.
 */
export function Choices({
  options,
  value,
  onChange,
  name,
  multi = false,
  columns = "auto",
}: {
  options: readonly { value: string; label: string; note?: string }[];
  value: string | string[];
  onChange: (v: string) => void;
  name: string;
  multi?: boolean;
  columns?: "auto" | "one";
}) {
  const selected = (v: string) => (Array.isArray(value) ? value.includes(v) : value === v);

  return (
    <div
      role={multi ? "group" : "radiogroup"}
      aria-label={name}
      className={
        columns === "one"
          ? "flex flex-col gap-3"
          : "flex flex-col gap-3 sm:flex-row sm:flex-wrap"
      }
    >
      {options.map((o) => {
        const on = selected(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`group/opt flex items-center justify-between gap-4 rounded-control border px-5 py-4 text-left transition-colors duration-200 sm:min-w-[13rem] ${
              on
                ? "border-rose bg-surface text-ink"
                : "border-line text-ink-muted hover:border-ink-muted hover:text-ink"
            }`}
          >
            <span className="flex flex-col gap-1">
              <span className="text-body">{o.label}</span>
              {o.note && <span className="text-caption text-ink-muted">{o.note}</span>}
            </span>

            {/* A small gold mark on the chosen answer. Gold is never a fill. */}
            <span
              aria-hidden
              className={`h-1.5 w-1.5 shrink-0 rounded-full transition-opacity duration-200 ${
                on ? "bg-gold opacity-100" : "bg-ink-muted opacity-0 group-hover/opt:opacity-40"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

const inputBase =
  "w-full rounded-control border border-line bg-surface px-5 py-4 text-body-lg text-ink " +
  "placeholder:text-ink-muted focus:border-rose focus:outline-none transition-colors duration-200";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputBase} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={4} className={inputBase} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputBase} />;
}
