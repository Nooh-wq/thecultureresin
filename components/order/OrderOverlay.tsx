"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { OrderFlow } from "./OrderFlow";

/**
 * The order form.
 *
 * It reads as a page: solid --canvas, full viewport, covering the site header,
 * one question at a time. It is still not a route. The open state syncs to
 * ?order=open so the whole thing can be linked directly, which matters because
 * she answers a lot of Instagram DMs, and ?piece=<slug> attaches a gallery
 * piece as a reference. Browser back closes it.
 *
 * Stacking. This can open on top of the gallery piece popup. It sits above
 * that modal, and while open it sets data-order-open on <body> so the piece
 * popup ignores Escape. One press closes the form and leaves the piece behind
 * it, rather than collapsing both.
 */
export function OrderOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const open = params.get("order") === "open";
  const piece = params.get("piece") ?? undefined;
  const openerRef = useRef<Element | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    next.delete("order");
    next.delete("piece");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement;
    document.body.dataset.orderOpen = "1";
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
    };
    // Capture phase, so this runs before the piece popup's own handler.
    window.addEventListener("keydown", onKey, true);

    return () => {
      window.removeEventListener("keydown", onKey, true);
      delete document.body.dataset.orderOpen;
      document.body.style.overflow = prevOverflow;
      (openerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Tell me what you’re imagining"
      className="fixed inset-0 z-[70] overflow-y-auto bg-canvas outline-none"
    >
      <OrderFlow initialPiece={piece} onClose={close} />
    </div>
  );
}
