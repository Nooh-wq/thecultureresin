import Image from "next/image";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/contact";

// Both destinations are confirmed. The handle has underscores; the run-together
// spelling that was here before is a different account, or none.
//
// The Email link was `mailto:` with nothing after it, which browsers render as
// a working link that opens a blank compose window addressed to nobody. It now
// shares one address with /privacy via lib/contact.ts.
//
// No WhatsApp link. Customers do not message her; she reaches out to them
// using the number and email the order form collects.
const SOCIALS = [
  { href: "https://www.instagram.com/the_culture_resin/", label: "Instagram" },
  { href: `mailto:${CONTACT_EMAIL}`, label: "Email" },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-content flex-col items-center gap-10 px-6 py-section md:px-10">
        {/* Full lockup here, max 140px tall. The footer is what establishes the
            complete mark, which is what lets the header monogram stand alone. */}
        <Image
          src="/brand/tcr-lockup-ink.png"
          alt="The Culture Resin"
          width={237}
          height={270}
          className="h-[140px] w-auto"
        />

        <p className="text-caption text-ink-muted">Handmade in Islamabad, Pakistan</p>

        {/* No order link down here. It isn't a page. */}
        <nav className="flex items-center gap-6">
          <Link href="/gallery" className="eyebrow text-ink-muted hover:text-ink">
            Gallery
          </Link>
          <span aria-hidden className="text-line">
            ·
          </span>
          <Link href="/about" className="eyebrow text-ink-muted hover:text-ink">
            About
          </Link>
        </nav>

        <nav className="flex items-center gap-6">
          {SOCIALS.map((s, i) => (
            <span key={s.label} className="flex items-center gap-6">
              {i > 0 && (
                <span aria-hidden className="text-line">
                  ·
                </span>
              )}
              <a href={s.href} className="eyebrow text-ink-muted hover:text-ink">
                {s.label}
              </a>
            </span>
          ))}
        </nav>

        {/* ADDED, NOT IN tcr-copy.md. The order form collects a name, a phone
            number, an email and an uploaded photograph, and she ships to
            Europe, so the privacy page has to be reachable from somewhere. */}
        <p className="flex items-center gap-4 text-caption text-ink-muted">
          <span>© The Culture Resin {new Date().getFullYear()}</span>
          <span aria-hidden className="text-line">
            ·
          </span>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
        </p>
      </div>
    </footer>
  );
}
