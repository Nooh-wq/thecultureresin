import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy.
 *
 * script-src carries 'unsafe-inline' because the App Router injects inline
 * bootstrap and streaming scripts on every page. Removing it needs a nonce
 * generated per request in middleware, which is worth doing later but is not
 * something to introduce on launch day. 'unsafe-eval' is development only:
 * webpack's hot reload needs it and production does not.
 *
 * The directives doing the real work here are frame-ancestors, object-src and
 * base-uri. Those are not weakened by inline script, and they close
 * clickjacking of the admin, plugin embedding, and <base> tag injection.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Tailwind and next/font both emit inline style, and Motion writes inline
  // styles on every animated element.
  "style-src 'self' 'unsafe-inline'",
  // data: and blob: for the LQIP placeholders, which are inline by design.
  "img-src 'self' data: blob: https://res.cloudinary.com",
  // Fonts are self-hosted by next/font at build time, so no Google origin.
  "font-src 'self'",
  // Direct browser-to-Cloudinary upload, because a Vercel function caps
  // request bodies at 4.5MB and the form advertises 10MB.
  "connect-src 'self' https://api.cloudinary.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Belt and braces with frame-ancestors, for anything predating CSP.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // The site asks for none of these. Saying so stops a future dependency
    // asking on her behalf.
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    // Two years, subdomains included. Browsers ignore this over plain http, so
    // it does nothing locally and everything on the real domain.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  images: {
    // AVIF first, WebP fallback. Section 11 of CLAUDE.md.
    formats: ["image/avif", "image/webp"],
    /**
     * Without this, every piece she adds through the admin renders as a broken
     * image in production.
     *
     * Gallery photographs upload browser-to-Cloudinary and are stored as
     * res.cloudinary.com URLs, but CuredImage renders them through next/image,
     * and next/image refuses any remote host not listed here. The eight seeded
     * pieces hid this, because they are local files under /public.
     *
     * Customer order uploads are deliberately NOT covered: the admin renders
     * those with a plain <img>, so an attacker-supplied file never reaches the
     * image optimiser. That matters more than it looks, because the optimiser
     * is sharp, and the sharp that Next 15 pins carries unpatched libvips CVEs.
     */
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
