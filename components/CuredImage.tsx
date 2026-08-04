"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { BLUR_DATA } from "@/lib/blur-data";

type Props = Omit<ImageProps, "placeholder" | "blurDataURL"> & {
  /** Staggers the cure within a grid row so a whole row does not resolve at once. */
  index?: number;
  /**
   * LQIP for database-backed images, which carry their own. Local seeded files
   * fall back to the generated table. Passed as a prop rather than looked up
   * here because the lookup needs Prisma and this is a client component.
   */
  blurDataUrl?: string;
  /**
   * CSS object-position from the piece's focal point, e.g. "30% 70%". Only
   * meaningful where the image is cropped to a fixed ratio.
   */
  focal?: string;
};

/**
 * The signature: pieces cure.
 *
 * Resin goes in cloudy and comes out as glass, so every image on the site cures
 * as it enters view. The blurred LQIP is the uncured state, which means the
 * load and the animation are one gesture and the site never shows a spinner.
 *
 * Implementation note. The brief describes this as filter: blur(12px)
 * saturate(0.4) resolving to blur(0) saturate(1). Animating a filter on a
 * viewport-sized image is one of the most expensive things you can ask a
 * mid-range Android to composite every frame, and most traffic here arrives on
 * exactly that device on mobile data. So the blur is applied once, statically,
 * to the placeholder layer, and only opacity and transform animate. Both are
 * GPU-composited. The result is the same haze clearing at a fraction of the
 * cost.
 */
export function CuredImage({
  index = 0,
  className = "",
  blurDataUrl,
  focal,
  style,
  ...props
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [cured, setCured] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const blur =
    blurDataUrl ?? (typeof props.src === "string" ? BLUR_DATA[props.src] : undefined);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setCured(true);
      return;
    }

    const el = wrapRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            // Reveals fire once. Never re-trigger on scroll up.
            io.disconnect();
            window.setTimeout(() => setCured(true), Math.min(index, 3) * 90);
          }
        }
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [index]);

  const settled = cured && loaded;

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${className}`}>
      {blur && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center transition-opacity duration-[900ms] ease-reveal"
          style={{
            backgroundImage: `url(${blur})`,
            backgroundPosition: focal ?? "center",
            filter: "blur(12px) saturate(0.4)",
            transform: "scale(1.08)",
            opacity: settled ? 0 : 1,
          }}
        />
      )}
      <Image
        {...props}
        style={focal ? { ...style, objectPosition: focal } : style}
        onLoad={() => setLoaded(true)}
        className={`relative transition-[opacity,transform] duration-[900ms] ease-reveal ${
          settled ? "scale-100 opacity-100" : "scale-[1.02] opacity-0"
        } ${props.fill ? "object-cover" : ""}`}
      />
    </div>
  );
}
