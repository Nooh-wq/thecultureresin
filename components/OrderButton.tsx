"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  children?: ReactNode;
  className?: string;
  /** Slug of a gallery piece to attach as a reference. Used by "Start with this". */
  piece?: string;
  variant?: "filled" | "outline";
};

/**
 * The primary action. It opens the order form overlay and does not navigate to
 * a new page, which is why this is a button.
 *
 * It does write ?order=open into the URL, deliberately: the form has to be
 * linkable for Instagram DMs, and it makes the browser back button close the
 * overlay.
 *
 * Reads the current query string from window.location at click time rather
 * than through useSearchParams. The hook would subscribe this component to
 * search params it never renders, and because this button sits on Home, About
 * and every piece page, that would opt all of them out of static prerendering
 * unless each usage were wrapped in its own Suspense boundary.
 */
export function OrderButton({
  children = "Place an order",
  className = "",
  piece,
  variant = "filled",
}: Props) {
  const router = useRouter();

  const open = () => {
    const next = new URLSearchParams(window.location.search);
    next.set("order", "open");
    if (piece) next.set("piece", piece);
    else next.delete("piece");
    router.push(`${window.location.pathname}?${next.toString()}`, { scroll: false });
  };

  const styles =
    variant === "filled"
      ? "bg-ink text-canvas hover:opacity-85"
      : "border border-line text-ink hover:border-ink";

  return (
    <button
      type="button"
      onClick={open}
      className={`eyebrow inline-flex items-center justify-center rounded-control px-6 py-3 transition-opacity duration-200 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
