"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * A short confirmation after something irreversible.
 *
 * Driven by a query parameter rather than client state, because the action
 * that triggers it redirects, and anything held in React is gone by the time
 * the new page renders.
 *
 * The parameter is stripped from the URL as soon as it is read, using
 * replaceState rather than the router. The router would re-render the page and
 * the server component would re-read searchParams, which fights the animation.
 * replaceState only edits the address bar, so a refresh or a shared link will
 * not resurrect a message about something deleted ten minutes ago.
 *
 * No shadow: section 3 of CLAUDE.md rules them out everywhere. It reads as a
 * panel because of the border and the surface colour, not because it floats.
 */
export function Toast({ message }: { message: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;

    const url = new URL(window.location.href);
    url.searchParams.delete("deleted");
    window.history.replaceState(null, "", url.toString());

    // Long enough to read a sentence without becoming furniture.
    const t = setTimeout(() => setShown(false), 5000);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-5 border border-line bg-surface px-6 py-4"
        >
          <span className="text-body text-ink">{message}</span>
          <button
            type="button"
            onClick={() => setShown(false)}
            className="eyebrow text-ink-muted hover:text-ink"
          >
            Close
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
