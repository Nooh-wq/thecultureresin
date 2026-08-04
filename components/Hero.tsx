"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { BLUR_DATA } from "@/lib/blur-data";

const ALT =
  "Round resin beach disc with a blue ocean and shell-strewn sand, resting on dark plum silk scattered with gold leaf";

/** Split by line, never by character. */
const LINES = ["Nothing I make", "gets made twice."];

/**
 * The hero. Two elements only: the image and the headline.
 *
 * Both use the same gesture, haze resolving into clarity, so it reads as one
 * idea rather than two effects competing. The image's blurred LQIP is its
 * uncured state, which is why there is no spinner and no skeleton.
 *
 * next/image cannot art-direct, so this is a real <picture>: a 16:9 crop
 * full-bleed on desktop and a 4:5 crop that drops the empty silk on portrait
 * phones. AVIF first, WebP fallback, PNG last. The landscape crop is never
 * letterboxed; it fills with object-cover.
 */
export function Hero() {
  const reduce = useReducedMotion();
  const [settled, setSettled] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSettled(true);
      return;
    }
    if (imgRef.current?.complete) setSettled(true);
  }, []);

  const container = {
    hidden: {},
    show: {
      transition: reduce
        ? {}
        : // 400ms after the image starts curing, then 180ms between lines.
          { delayChildren: 0.4, staggerChildren: 0.18 },
    },
  };

  /**
   * Animating filter: blur() on text is a full repaint every frame, and the
   * perf budget here is a mid-range Android on mobile data. Desktop gets the
   * blur; phones get the same reveal without it, which reads almost
   * identically at this size.
   *
   * The blur stays in the variant and the no-mobile-blur class removes it on
   * small screens. Branching this in JavaScript did not work: the variant is
   * captured on the first render, before a useEffect media-query check can
   * run, so phones painted the headline blurred and only corrected afterwards.
   */
  const line = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 12, filter: "blur(14px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: reduce ? { duration: 0 } : { duration: 1.1, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section className="relative flex flex-col lg:block lg:h-screen lg:min-h-[38rem]">
      <div className="relative lg:absolute lg:inset-0">
        {/* The uncured state. Static blur, so only opacity animates. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center transition-opacity duration-[900ms] ease-reveal"
          style={{
            backgroundImage: `url(${BLUR_DATA["/images/hero/hero-16x9.png"]})`,
            filter: "blur(12px) saturate(0.4)",
            transform: "scale(1.08)",
            opacity: settled ? 0 : 1,
          }}
        />

        <picture>
          <source
            media="(max-width: 767px)"
            type="image/avif"
            srcSet="/images/hero/hero-4x5.avif"
          />
          <source
            media="(max-width: 767px)"
            type="image/webp"
            srcSet="/images/hero/hero-4x5.webp"
          />
          <source media="(max-width: 767px)" srcSet="/images/hero/hero-4x5.png" />
          <source type="image/avif" srcSet="/images/hero/hero-16x9.avif" />
          <source type="image/webp" srcSet="/images/hero/hero-16x9.webp" />
          <img
            ref={imgRef}
            src="/images/hero/hero-16x9.png"
            alt={ALT}
            width={1672}
            height={941}
            fetchPriority="high"
            decoding="async"
            onLoad={() => setSettled(true)}
            className={`aspect-[4/5] w-full object-cover transition-[opacity,transform] duration-[900ms] ease-reveal md:aspect-[16/9] lg:h-full lg:aspect-auto ${
              settled ? "scale-100 opacity-100" : "scale-[1.02] opacity-0"
            }`}
          />
        </picture>

        {/*
          Scrim behind the headline, desktop only.

          The silk itself is fine: the headline band averages 10.5:1 against
          --ink. The problem is the scattered gold leaf, which blows out to
          pure white in places. Moving the headline does not escape it, because
          the flecks are spread across the whole right side: starting the band
          at 66% instead of 58% still leaves specular highlights on 0.77% of
          the area, at roughly 1:1 contrast. A few words of a two-line headline
          landing on one of those would be unreadable.

          So this knocks the flecks back under the text. Over silk already at
          0.03 luminance it is invisible as a panel; it only removes the
          highlights. It is a gradient, not a shadow.
        */}
        <div className="hero-scrim pointer-events-none absolute inset-y-0 right-0 hidden w-[55%] lg:block" />

        {/* The hero is full-bleed, so its bottom edge meets the next section
            directly. The bottom strip of the file averages #1E1314 against a
            --canvas of #1C1315, two points apart, so this dissolves the seam
            rather than covering it.

            hero-fade is an eased multi-stop ramp rather than a two-stop
            linear one. Measured against the real hero pixels this is only a
            marginal improvement, 0.356 to 0.340 peak slope break at the onset,
            and it was NOT the cause of the seam that prompted it. Kept because
            it is better practice for a fade over photography and costs
            nothing. Height left at 20%: the hero's composition was never the
            problem. */}
        <div className="hero-fade pointer-events-none absolute inset-x-0 bottom-0 h-[20%]" />
      </div>

      {/* Headline. Right third on desktop, vertically centred; below the image
          at full width on phones. */}
      <div className="relative px-6 pt-10 pb-4 lg:absolute lg:inset-y-0 lg:right-0 lg:flex lg:w-[42%] lg:items-center lg:px-0 lg:pr-[4%] lg:pt-0 lg:pb-0">
        {/*
          The brief specified clamp(2.75rem, 5.5vw, 5rem). Measured against the
          column beside the piece, that does not fit: "gets made twice." needs
          about 41.5vw at 5.5vw and the column only offers 36vw. Both lines
          silently wrapped at 1024, 1280 and 1440, so the headline rendered as
          four lines instead of two. Only 1920 fitted.

          4.5vw with a 2.5rem floor clears every width. Measured in Alegreya SC:
          36px slack at 1024, 50px at 1440, 78px at 1920, and single lines
          throughout.

          The floor is 2.5rem rather than the specified 2.75rem because at 44px
          the line runs 360px on a 391px phone with 343px of room, and wraps.

          The side-by-side layout starts at lg, not md. At 768 the clamp is
          already on its floor while the column is at its narrowest, which
          overflowed by 30px. Below 1024 the headline sits under the image.

          whitespace-nowrap makes a future regression loud instead of silent.
        */}
        <motion.h1
          variants={container}
          initial="hidden"
          animate="show"
          className="font-display text-ink"
          style={{ fontSize: "clamp(2.5rem, 4.5vw, 5rem)", lineHeight: 1.06 }}
        >
          {LINES.map((text) => (
            <motion.span
              key={text}
              variants={line}
              className="no-mobile-blur block will-change-[opacity,filter] lg:whitespace-nowrap"
            >
              {text}
            </motion.span>
          ))}
        </motion.h1>
      </div>
    </section>
  );
}
