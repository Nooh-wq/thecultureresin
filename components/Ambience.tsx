/**
 * The background.
 *
 * Three layers, none of which run any JavaScript:
 *
 *   1. Grain. A 128px tile at 4% opacity. Large flat areas of #1C1315 read as
 *      dead pixel rather than as a surface, and tooth fixes that more
 *      convincingly than movement does. This layer does not animate at all.
 *   2. Two pools of light, easing very slowly across the page in --rose.
 *   3. Gold leaf, drifting in a slow current, which is what her pieces
 *      literally are: flecks suspended in cured resin.
 *
 * Deliberate constraints:
 *
 *   Only transform and opacity animate. Both are GPU composited, so nothing
 *   here causes layout or paint work on scroll. There is no rAF loop, no
 *   canvas and no library.
 *
 *   It sits at a negative z-index behind everything, so it never appears over
 *   the hero, a gallery photograph or any text. It only shows where the page
 *   was empty, which is the whole point.
 *
 *   Positions and timings are a fixed table rather than Math.random(), because
 *   a random value at render time differs between the server and the client
 *   and produces a hydration mismatch.
 *
 *   Section 4 says never more than two elements animating at once. This is a
 *   knowing exception, and the reason it is defensible is that none of it is
 *   content: at these speeds, 50 to 110 seconds a cycle, nothing here reads as
 *   motion. It reads as depth. If it ever competes with the cure transition
 *   for attention it has failed and should come out.
 *
 *   Under prefers-reduced-motion the global rule in globals.css settles every
 *   animation instantly, leaving the grain and a still field of flecks.
 */

type Mote = {
  /** left %, top %, size px, seconds, delay s, drift x, drift y */
  x: number;
  y: number;
  s: number;
  d: number;
  delay: number;
  dx: string;
  dy: string;
};

const MOTES: Mote[] = [
  { x: 8, y: 14, s: 2, d: 74, delay: -4, dx: "5vw", dy: "-9vh" },
  { x: 21, y: 62, s: 1, d: 96, delay: -22, dx: "-4vw", dy: "-14vh" },
  { x: 33, y: 28, s: 3, d: 62, delay: -11, dx: "7vw", dy: "-6vh" },
  { x: 44, y: 81, s: 1, d: 88, delay: -37, dx: "3vw", dy: "-12vh" },
  { x: 57, y: 9, s: 2, d: 70, delay: -8, dx: "-6vw", dy: "-8vh" },
  { x: 63, y: 47, s: 1, d: 110, delay: -51, dx: "4vw", dy: "-16vh" },
  { x: 71, y: 73, s: 2, d: 66, delay: -19, dx: "-3vw", dy: "-7vh" },
  { x: 79, y: 22, s: 3, d: 84, delay: -30, dx: "5vw", dy: "-11vh" },
  { x: 88, y: 55, s: 1, d: 92, delay: -14, dx: "-5vw", dy: "-13vh" },
  { x: 94, y: 88, s: 2, d: 58, delay: -45, dx: "2vw", dy: "-6vh" },
  { x: 15, y: 92, s: 1, d: 78, delay: -26, dx: "6vw", dy: "-10vh" },
  { x: 49, y: 38, s: 2, d: 104, delay: -60, dx: "-4vw", dy: "-15vh" },
  { x: 27, y: 5, s: 1, d: 68, delay: -33, dx: "3vw", dy: "-8vh" },
  { x: 84, y: 40, s: 2, d: 50, delay: -17, dx: "-2vw", dy: "-5vh" },
];

export function Ambience() {
  return (
    <div
      aria-hidden
      data-ambience
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* 1 · Grain. Static. */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "url(/brand/grain.png)", backgroundRepeat: "repeat" }}
      />

      {/*
        2 · Two pools of light. Rose, and very nearly not there.

        The first version drew these with `radial-gradient(circle, ...)` inside
        a rounded-full box, and it left a visible horizontal cut across the
        page. `circle` with no size keyword means farthest-corner: on a
        752x470 box that is a 443px radius, so the gradient reached
        transparency at 302px. The box half-height is 235px. It was still at
        22% alpha where the border radius clipped it, and a wide flat ellipse
        sliced across the top and bottom reads as two horizontal lines.
        Horizontally it was fine, which is why it looked like a stray seam
        rather than a shape.

        ambient-pool uses ellipse closest-side, so the radii match the box and
        the last stop lands on every edge at zero alpha. Nothing is left to
        clip, and rounded-full is gone because the gradient now defines the
        shape.
      */}
      <div
        className="ambient-pool absolute -left-[10%] top-[8%] h-[45vh] w-[45vw] opacity-[0.055]"
        style={{ animation: "tcr-pool 64s ease-in-out infinite" }}
      />
      <div
        className="ambient-pool absolute -right-[8%] bottom-[12%] h-[52vh] w-[42vw] opacity-[0.045]"
        style={{ animation: "tcr-pool 86s ease-in-out infinite reverse", animationDelay: "-30s" }}
      />

      {/* 3 · Gold leaf in suspension. Small marks, never a fill or a gradient. */}
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-gold"
          style={
            {
              left: `${m.x}%`,
              top: `${m.y}%`,
              width: m.s,
              height: m.s,
              "--dx": m.dx,
              "--dy": m.dy,
              animation: `tcr-drift ${m.d}s linear ${m.delay}s infinite alternate, tcr-shimmer ${
                m.d / 3
              }s ease-in-out ${m.delay}s infinite`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
