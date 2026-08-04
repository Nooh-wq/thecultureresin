"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { BLUR_DATA } from "@/lib/blur-data";

/**
 * Three states of the material, one line each.
 *
 * NOTE: these are photographs of finished pieces standing in for genuine macro
 * shots of resin curing, which do not exist yet. They were chosen to track the
 * three states, milky, unresolved, then glass. Real macro photography would be
 * better and should replace them.
 */
const STAGES = [
  {
    line: "It goes in cloudy and stays that way for a while.",
    src: "/images/pieces/rose-keepsake-disc.jpg",
    alt: "Milky translucent resin disc holding a single dried red rose, the surface still soft and clouded",
    width: 1402,
    height: 1401,
  },
  {
    line: "Then two days of nothing. This is the part I hate.",
    src: "/images/pieces/pink-geode-wall-clock.jpg",
    alt: "Cream and pink marbled resin surface with a crushed stone geode edge, part way to setting",
    width: 1440,
    height: 1800,
  },
  {
    line: "After that it’s glass.",
    src: "/images/pieces/black-gold-wall-clock.jpg",
    alt: "Cured black and gold resin surface polished to a mirror, reflecting the light",
    width: 1440,
    height: 1440,
  },
];

/**
 * The one pinned section on the entire site.
 *
 * position: sticky plus useScroll, as specified. No GSAP, no ScrollTrigger.
 * The three images cross-fade as the user scrolls and one line appears with
 * each. Never more than two elements animating at once: at any scroll position
 * exactly one pair is mid-crossfade.
 *
 * Under prefers-reduced-motion the whole thing degrades to three plain stacked
 * blocks with no pinning and no scroll coupling, because a sticky section
 * driven by scroll position is exactly what that setting is asking us not to
 * do.
 */
export function MaterialSequence() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  if (reduce) {
    return (
      <section className="mx-auto flex max-w-content flex-col gap-16 px-6 md:px-10">
        {STAGES.map((s) => (
          <div key={s.line} className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
            <Image
              src={s.src}
              alt={s.alt}
              width={s.width}
              height={s.height}
              sizes="(max-width: 768px) 100vw, 50vw"
              placeholder={BLUR_DATA[s.src] ? "blur" : "empty"}
              blurDataURL={BLUR_DATA[s.src]}
              className="aspect-[4/3] w-full object-cover"
            />
            <p className="font-display text-display-md text-ink">{s.line}</p>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[300vh]">
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] items-center">
        <div className="mx-auto grid w-full max-w-content items-center gap-8 px-6 md:grid-cols-2 md:gap-16 md:px-10">
          <div className="relative aspect-[4/3]">
            {STAGES.map((s, i) => (
              <Panel key={s.src} index={i} progress={scrollYProgress} stage={s} />
            ))}
          </div>
          <div className="relative min-h-[6rem]">
            {STAGES.map((s, i) => (
              <Line key={s.line} index={i} progress={scrollYProgress}>
                {s.line}
              </Line>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Each panel owns a third of the scroll range and cross-fades with its
 * neighbour.
 *
 * Written as a transform function rather than an input/output keyframe range
 * on purpose. The range form needs points outside 0..1 to let the first panel
 * begin fully visible and the last end that way, and Motion passes those
 * straight through to the Web Animations API, whose keyframe offsets must sit
 * within 0..1 and never decrease. That threw
 * "Offsets must be monotonically non-decreasing" and took the whole page down
 * on hydration. A function produces no keyframe offsets at all.
 */
function useBand(progress: ReturnType<typeof useScroll>["scrollYProgress"], index: number) {
  return useTransform(progress, (v) => {
    const step = 1 / STAGES.length;
    const start = index * step;
    const end = start + step;
    const fade = step * 0.3;

    if (index === 0 && v <= start + fade) return 1;
    if (index === STAGES.length - 1 && v >= end - fade) return 1;

    if (v <= start - fade || v >= end + fade) return 0;
    if (v < start + fade) return (v - (start - fade)) / (2 * fade);
    if (v > end - fade) return (end + fade - v) / (2 * fade);
    return 1;
  });
}

function Panel({
  index,
  progress,
  stage,
}: {
  index: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  stage: (typeof STAGES)[number];
}) {
  const opacity = useBand(progress, index);
  return (
    <motion.div style={{ opacity }} className="absolute inset-0">
      <Image
        src={stage.src}
        alt={stage.alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        placeholder={BLUR_DATA[stage.src] ? "blur" : "empty"}
        blurDataURL={BLUR_DATA[stage.src]}
        className="object-cover"
      />
    </motion.div>
  );
}

function Line({
  index,
  progress,
  children,
}: {
  index: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  children: React.ReactNode;
}) {
  const opacity = useBand(progress, index);
  return (
    <motion.p
      style={{ opacity }}
      className="absolute inset-x-0 top-0 font-display text-display-md text-ink"
    >
      {children}
    </motion.p>
  );
}
