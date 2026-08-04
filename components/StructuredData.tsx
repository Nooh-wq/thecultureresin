import type { Piece } from "@/lib/pieces";
import { SITE_URL as SITE } from "@/lib/site-url";

function Ld({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * LocalBusiness, city level only.
 *
 * Deliberately no streetAddress. She works from one room in Islamabad, which is
 * almost certainly her home, and LocalBusiness markup is exactly the thing that
 * would publish a home address to every search engine. City and country is
 * enough for local search and gives away nothing she has not already said.
 */
export function BusinessSchema() {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "The Culture Resin",
        description:
          "Handmade resin art from Islamabad. Wall clocks, tables, keepsakes and jewellery, all made to order.",
        url: SITE,
        image: `${SITE}/images/hero/hero-16x9.png`,
        founder: { "@type": "Person", name: "Amna" },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Islamabad",
          addressCountry: "PK",
        },
        areaServed: ["PK", "AE", "SA", "QA", "KW", "BH", "OM", "US", "CA", "GB"],
      }}
    />
  );
}

/**
 * CreativeWork, not Product.
 *
 * Nothing is sold off a shelf, there is no cart, no stock and no price. Product
 * markup would invite search engines to ask for an offer and a price that do
 * not exist.
 */
export function PieceSchema({ piece }: { piece: Piece }) {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: piece.title,
        description: piece.storyNote ?? piece.images[0].alt,
        url: `${SITE}/gallery/${piece.slug}`,
        image: `${SITE}${piece.images[0].src}`,
        creator: { "@type": "Person", name: "Amna", url: `${SITE}/about` },
        artMedium: "Resin",
        ...(piece.materials ? { material: piece.materials } : {}),
      }}
    />
  );
}
