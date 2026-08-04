"use client";

import { useRef, useState } from "react";

/**
 * Focal point editor.
 *
 * Two panes: the whole photograph, where clicking or dragging sets the point,
 * and beside it the exact 4:5 crop the gallery card will show, updating live.
 *
 * Sliders alone were nearly useless here. They gave two abstract numbers with
 * no way to see the result until after a save, on the one setting whose entire
 * purpose is deciding what survives a crop.
 */
export function FocalPicker({
  src,
  alt,
  x,
  y,
  onChange,
}: {
  src: string;
  alt: string;
  x: number;
  y: number;
  onChange: (x: number, y: number) => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const setFromEvent = (clientX: number, clientY: number) => {
    const el = areaRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const ny = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    onChange(Number(nx.toFixed(3)), Number(ny.toFixed(3)));
  };

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
      <div className="flex flex-col gap-2">
        <span className="eyebrow text-ink-muted">Click the part that matters</span>
        <div
          ref={areaRef}
          role="application"
          aria-label="Focal point"
          className="relative w-56 cursor-crosshair select-none border border-line"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(true);
            setFromEvent(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => dragging && setFromEvent(e.clientX, e.clientY)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="block w-full" draggable={false} />
          <span
            aria-hidden
            className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold"
            style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold"
            style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="eyebrow text-ink-muted">What the gallery shows</span>
        <div className="w-40 border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="aspect-[4/5] w-full object-cover"
            style={{ objectPosition: `${x * 100}% ${y * 100}%` }}
            draggable={false}
          />
        </div>
        <p className="text-caption text-ink-muted">
          {Math.round(x * 100)}% · {Math.round(y * 100)}%
        </p>
        <button
          type="button"
          onClick={() => onChange(0.5, 0.5)}
          className="eyebrow self-start text-ink-muted hover:text-ink"
        >
          Centre it
        </button>
      </div>

      {/* Submitted with the form. */}
      <input type="hidden" name="focalX" value={x} />
      <input type="hidden" name="focalY" value={y} />
    </div>
  );
}
