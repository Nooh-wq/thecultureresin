import { Alegreya_SC, Karla } from "next/font/google";

/**
 * Both faces are self-hosted as woff2. next/font downloads them at build time
 * and serves them from our own origin, so there is no request to Google at
 * runtime and no layout shift from a late swap.
 *
 * Display is Alegreya SC, replacing the Bodoni Moda that CLAUDE.md section 3
 * specified. It is a small-caps face: lowercase renders as small capitals, so
 * every heading reads in caps regardless of how it is typed.
 *
 * One consequence worth knowing. Bodoni was restricted to 32px and above
 * because Didone hairlines go fragile below that. Alegreya SC is a sturdy
 * oldstyle serif with even stroke weight, so that floor no longer applies and
 * the 20px header monogram is on safer ground than it was.
 *
 * Karla 500 is preloaded alongside 400 because every eyebrow is set in it and
 * the first eyebrow a visitor sees is above the fold.
 */
export const alegreya = Alegreya_SC({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal"],
  display: "swap",
  variable: "--font-alegreya",
  preload: true,
});

export const karla = Karla({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal"],
  display: "swap",
  variable: "--font-karla",
  preload: true,
});
