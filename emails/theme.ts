/**
 * Email styling.
 *
 * Custom fonts will not load in most email clients, so Alegreya SC is declared
 * with a Georgia fallback and every layout decision assumes the fallback wins,
 * which it usually will. Nothing here depends on a webfont's metrics.
 *
 * Note that when the fallback wins the small caps are lost too, not just the
 * typeface, so headings in email arrive in ordinary sentence case. That is
 * fine, and better than forcing text-transform, which would shout.
 *
 * The palette matches the site. Dark backgrounds are stripped by a few older
 * clients, so text colour and background colour are always set together and
 * never rely on inheritance.
 */

export const c = {
  canvas: "#1C1315",
  surface: "#26191C",
  ink: "#EDE8E4",
  inkMuted: "#A99A96",
  rose: "#B87A80",
  gold: "#C9A227",
  line: "#3A2A2E",
};

export const display = {
  fontFamily: "'Alegreya SC', Georgia, 'Times New Roman', serif",
  color: c.ink,
  margin: "0",
};

export const body = {
  fontFamily: "'Karla', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
  fontSize: "16px",
  lineHeight: "1.7",
  color: c.inkMuted,
};

export const eyebrow = {
  fontFamily: "'Karla', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
  fontSize: "12px",
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: c.inkMuted,
  margin: "0",
};
