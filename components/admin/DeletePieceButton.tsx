"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Confirmation before an irreversible delete.
 *
 * The delete button used to fire straight into the server action, so one
 * misclick removed a piece and everything attached to it with no undo. That is
 * not hypothetical: it happened once during development and the piece had to
 * be restored by re-seeding.
 *
 * A dialog rather than window.confirm(), for two reasons. It can name the
 * piece and say how many photographs go with it, which is the information that
 * actually prevents the mistake. And a native confirm is a system chrome box
 * that looks nothing like the rest of the admin, which makes it easy to click
 * through on autopilot.
 *
 * Escape closes, clicking outside closes, and Cancel is the button that gets
 * focus, so the dangerous option is never the one a stray Enter lands on.
 */
export function DeletePieceButton({
  title,
  imageCount,
  action,
}: {
  title: string;
  imageCount: number;
  /** The server action bound to this piece's id. */
  action: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    // Focus Cancel, not Delete.
    cancelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="mt-16 border-t border-line pt-8">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="eyebrow text-ink-muted transition-colors duration-200 hover:text-rose"
      >
        Delete this piece
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-canvas/85 px-6"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-heading"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md border border-line bg-canvas px-8 py-9 outline-none"
          >
            <h2 id="delete-heading" className="font-display text-display-md text-ink">
              Delete this piece?
            </h2>

            <p className="mt-5 text-body text-ink-muted">
              <span className="text-ink">{title}</span> will be removed from the gallery and
              from the site.
              {imageCount > 0 && (
                <>
                  {" "}
                  Its {imageCount === 1 ? "photograph goes" : `${imageCount} photographs go`}{" "}
                  with it.
                </>
              )}{" "}
              This cannot be undone.
            </p>

            <div className="mt-9 flex items-center justify-end gap-3">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setOpen(false)}
                className="eyebrow rounded-control border border-line px-5 py-3 text-ink outline-none transition-colors duration-200 hover:border-ink"
              >
                Cancel
              </button>

              <form action={action}>
                <Confirm />
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Separate component so useFormStatus can see the form above it. Deleting is
 * a round trip to Supabase in Singapore, long enough that a second click is
 * likely if nothing says the first one landed.
 */
function Confirm() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="eyebrow rounded-control bg-rose px-5 py-3 text-canvas transition-opacity duration-200 hover:opacity-85 disabled:opacity-60"
    >
      {pending ? "Deleting" : "Delete"}
    </button>
  );
}
