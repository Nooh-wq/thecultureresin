"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

const STEPS = [
  {
    n: "01",
    title: "Pour",
    body: "Flowers get dried for weeks before anything else happens, pressed flat or hung upside down depending on what they are. Then resin and hardener are measured and mixed by hand. There’s a window of about forty minutes before it starts to thicken, and once it’s in the mould there’s no changing it.",
  },
  { n: "02", title: "Cure", body: "Two days, covered, untouched. Dust is the whole problem." },
  {
    n: "03",
    title: "Sand",
    body: "Wet sanding by hand, through six or seven grades of paper, until the edge stops catching on your finger.",
  },
  { n: "04", title: "Finish", body: "Polish until you stop noticing the surface." },
];

/**
 * The process, as a timeline that resolves as you scroll.
 *
 * Each step arrives the way everything else on this site does: a haze
 * clearing. The number and its title come in first, the body follows 160ms
 * behind, both from blur into focus. That ordering is the point, since it
 * makes you read the step before you read the paragraph.
 *
 * Only two things animate at once, which is the section 4 limit: the label and
 * the body of a single step. The gold rule and its markers are static
 * furniture, drawn once by scroll position rather than animated per step.
 *
 * Gold is a hairline here and nothing else. The labels are --ink. An earlier
 * version set them in gold text, which section 3 forbids outright and which
 * also read as washed out at 12px on a near-black ground.
 *
 * This is the only numbered content on the site; pour to cure to sand to
 * finish is a real sequence and the order carries information. Do not add
 * numbering anywhere else.
 */
export function ProcessTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 78%", "end 62%"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const scaleY = useTransform(smooth, (v) => (reduce ? 1 : Math.max(0.001, v)));

  const group = {
    hidden: {},
    show: { transition: reduce ? {} : { staggerChildren: 0.16 } },
  };

  // The blur is always in the variant. The no-mobile-blur class strips it on
  // small screens, which is correct on the first paint in a way that a
  // JavaScript media-query check is not.
  const item = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 14, filter: "blur(10px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: reduce ? { duration: 0 } : { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <div ref={ref} className="relative">
      {/* Track, then the gold rule that fills over it as you read. */}
      <div aria-hidden className="absolute bottom-0 left-px top-0 w-px bg-line" />
      <motion.div
        aria-hidden
        style={{ scaleY }}
        className="absolute bottom-0 left-px top-0 w-px origin-top bg-gold"
      />

      <ol className="flex flex-col">
        {STEPS.map((step) => (
          <motion.li
            key={step.n}
            variants={group}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "0px 0px -18% 0px" }}
            className="relative grid gap-3 py-9 pl-8 md:grid-cols-[13rem_1fr] md:gap-10 md:py-12 md:pl-14"
          >
            {/* Small gold mark on the rule, level with the label. Static: it is
                part of the track, not part of the reveal. */}
            <span
              aria-hidden
              className="absolute left-0 top-[2.65rem] block h-[5px] w-[5px] -translate-x-[2px] rounded-full bg-gold md:top-[3.45rem]"
            />

            <motion.p
              variants={item}
              className="font-display text-display-md leading-none text-ink no-mobile-blur will-change-[opacity,filter]"
            >
              {step.n}
              <span className="mx-2 text-ink-muted">·</span>
              {step.title}
            </motion.p>

            <motion.p
              variants={item}
              className="max-w-prose text-body-lg text-ink-muted no-mobile-blur will-change-[opacity,filter]"
            >
              {step.body}
            </motion.p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
