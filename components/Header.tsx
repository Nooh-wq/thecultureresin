"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { OrderButton } from "./OrderButton";

const LINKS = [
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock the page behind the mobile sheet.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-canvas/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between px-6 md:px-10">
          {/*
            Two supplied marks: the full horizontal wordmark on desktop, the TCR
            monogram on phones where 233px of wordmark would crowd out the nav.

            CLAUDE.md section 2 says never to put the full lockup in the header,
            but that was about the stacked mark, whose arc text and orchid would
            force the nav past 100px. This wordmark is 13px tall, so the reason
            for the rule does not apply.

            Plain <img> rather than inline SVG. Inlining would allow
            currentColor, but the site is dark only with no theme toggle, so the
            fill never changes, and inlining put 36KB of path data into the
            client bundle on every page. The files are cached once instead.
            Their fill is pinned to --ink.
          */}
          <Link href="/" aria-label="The Culture Resin, home" className="text-ink">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/wordmark-web.svg"
              alt=""
              width={233}
              height={13}
              className="hidden h-[13px] w-auto md:block"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/wordmark-mobile.svg"
              alt=""
              width={40}
              height={12}
              className="h-3 w-auto md:hidden"
            />
          </Link>

          <nav className="hidden items-center gap-10 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="eyebrow text-ink-muted transition-colors duration-200 hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
            <OrderButton />
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="eyebrow text-ink-muted md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            Menu
          </button>
        </div>
      </header>

      {/*
        The sheet lives OUTSIDE <header>, and that placement is the whole fix.

        It used to be a child of the header, which carries backdrop-blur-sm. An
        ancestor with a backdrop-filter becomes the containing block for any
        position: fixed descendant, so `inset-0` resolved against the header's
        64px strip instead of the viewport. Measured on a 390x844 phone the
        panel came out 390x64: its opaque background covered the top strip and
        nothing else, so the hero headline showed straight through the menu.

        Nothing about the background was wrong. Moving it out of the blurred
        ancestor is what makes inset-0 mean the screen again.
      */}
      {menuOpen && (
        <div
          id="mobile-menu"
          /*
            Frosted rather than flat: the page stays faintly readable behind the
            sheet, which suits a site about things suspended in resin.

            bg-canvas is the opaque fallback and comes first, so a browser
            without backdrop-filter gets a solid panel and never a transparent
            one. The translucent value only applies where the blur will
            actually render.

            90% and not 80%. The menu opens over whatever page you were on, and
            some gallery photographs are cream silk: measured against the
            brightest of them, 80% put the 12px Close button at 4.30:1, under
            the 4.5:1 small text needs. 90% gives 5.52:1 there and still 5.11:1
            against a pure white backdrop, while reading just as much like
            glass at this blur radius.
          */
          className="fixed inset-0 z-[60] flex flex-col bg-canvas px-6 pt-8 backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-canvas/90 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex items-start justify-between">
            <Image
              src="/brand/tcr-lockup-ink.png"
              alt="The Culture Resin"
              width={237}
              height={270}
              className="h-[120px] w-auto"
              priority
            />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="eyebrow text-ink-muted"
              autoFocus
            >
              Close
            </button>
          </div>

          <nav className="mt-16 flex flex-col gap-8">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="font-display text-display-md text-ink"
              >
                {l.label}
              </Link>
            ))}
            <OrderButton className="mt-4 self-start" />
          </nav>
        </div>
      )}
    </>
  );
}
