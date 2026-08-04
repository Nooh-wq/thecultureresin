"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CuredImage } from "./CuredImage";
import { PieceDetail } from "./PieceDetail";
import type { Piece } from "@/lib/pieces";

export function PieceModal({ piece }: { piece: Piece }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);
  const touchX = useRef<number | null>(null);

  const total = piece.images.length;
  const close = useCallback(() => router.back(), [router]);

  // Remember what had focus, and give it back on close.
  useEffect(() => {
    openerRef.current = document.activeElement;
    panelRef.current?.focus();
    return () => {
      (openerRef.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The order form can sit on top of this. When it does, it owns Escape:
      // one press closes the form and leaves this piece behind it.
      if (document.body.dataset.orderOpen) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" && total > 1) setIndex((i) => (i + 1) % total);
      if (e.key === "ArrowLeft" && total > 1) setIndex((i) => (i - 1 + total) % total);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, total]);

  const image = piece.images[index];

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-canvas/80"
      onClick={close}
      role="presentation"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={piece.title}
        onClick={(e) => e.stopPropagation()}
        className="mx-auto min-h-full max-w-content bg-canvas px-6 py-10 outline-none md:px-10"
      >
        <button
          type="button"
          onClick={close}
          className="eyebrow mb-8 text-ink-muted transition-colors duration-200 hover:text-ink"
        >
          Close
        </button>

        <div className="grid gap-10 md:grid-cols-3 md:gap-16">
          <div className="md:col-span-2">
            <div
              className="relative"
              onTouchStart={(e) => {
                touchX.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (touchX.current === null || total < 2) return;
                const dx = e.changedTouches[0].clientX - touchX.current;
                if (Math.abs(dx) > 48) {
                  setIndex((i) => (dx < 0 ? (i + 1) % total : (i - 1 + total) % total));
                }
                touchX.current = null;
              }}
            >
              <CuredImage
                key={image.src}
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                blurDataUrl={image.blurDataUrl}
                sizes="(max-width: 768px) 100vw, 66vw"
                className="w-full"
                priority
              />
              {total > 1 && (
                <p className="absolute bottom-3 left-3 text-caption text-ink">
                  {index + 1} / {total}
                </p>
              )}
            </div>

            {total > 1 && (
              <ul className="mt-4 flex gap-3">
                {piece.images.map((img, i) => (
                  <li key={img.src}>
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Image ${i + 1}`}
                      aria-current={i === index}
                      className={`block border ${i === index ? "border-gold" : "border-line"}`}
                    >
                      <Image
                        src={img.src}
                        alt=""
                        width={img.width}
                        height={img.height}
                        sizes="80px"
                        className="h-20 w-20 object-cover"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <PieceDetail piece={piece} />
        </div>
      </div>
    </div>
  );
}
