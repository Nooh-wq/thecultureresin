import type { Metadata } from "next";
import { alegreya, karla } from "@/lib/fonts";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  // SITE_URL is already validated, so this new URL() cannot throw. It used to
  // read the raw environment variable, and a value pasted with its quotes
  // still attached failed the production build here.
  metadataBase: new URL(SITE_URL),
  title: "The Culture Resin | Handmade Resin Art, Islamabad",
  description:
    "Handmade resin art from Islamabad. Wall clocks, tables, keepsakes and jewellery, all made to order.",
  openGraph: {
    type: "website",
    siteName: "The Culture Resin",
    locale: "en_GB",
    images: [{ url: "/images/hero/hero-16x9.png", width: 1672, height: 941 }],
  },
};

/**
 * Deliberately thin: fonts, tokens and the document shell, nothing else.
 *
 * The public header, footer, smooth scrolling and the order overlay all belong
 * to the (site) group. The admin is a different product for a different person
 * and must not inherit the customer nav, the "Place an order" button or the
 * marketing footer.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${alegreya.variable} ${karla.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
