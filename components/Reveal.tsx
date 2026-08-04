"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The one reveal vocabulary on the site: opacity 0 to 1 with a 20px upward
 * drift, 700ms, cubic-bezier(0.16, 1, 0.3, 1).
 *
 * Reveals fire once and never re-trigger on scroll up. Plain
 * IntersectionObserver and a CSS transition rather than Motion, because this
 * wraps a lot of elements and none of them need a JS animation loop.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "p";
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            io.disconnect();
            window.setTimeout(() => setShown(true), delay);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  const Component = Tag as React.ElementType;

  return (
    <Component
      ref={ref as React.Ref<HTMLElement>}
      className={`transition-[opacity,transform] duration-700 ease-reveal ${
        shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      } ${className}`}
    >
      {children}
    </Component>
  );
}
