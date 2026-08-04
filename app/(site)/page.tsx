import Link from "next/link";
import { CuredImage } from "@/components/CuredImage";
import { Hero } from "@/components/Hero";
import { MaterialSequence } from "@/components/MaterialSequence";
import { OrderButton } from "@/components/OrderButton";
import { ProcessTimeline } from "@/components/ProcessTimeline";
import { Reveal } from "@/components/Reveal";
import { getFeaturedPieces } from "@/lib/gallery";
import { focalPosition } from "@/lib/pieces";

export const revalidate = 60;

const MAKES = [
  {
    title: "Things you use",
    body: "Clocks, tables, trays, chopping boards. Art with a job.",
    src: "/images/pieces/black-gold-wall-clock.jpg",
    alt: "Round black resin wall clock with gold marbled veining and gold Roman numerals",
    width: 1440,
    height: 1440,
  },
  {
    title: "Things you keep",
    body: "Birth plates, wedding flowers, and the occasional request I don’t have a name for.",
    src: "/images/pieces/rose-keepsake-disc.jpg",
    alt: "Round translucent resin disc holding a single dried red rose on its stem",
    width: 1402,
    height: 1401,
  },
  {
    title: "Things you wear",
    body: "Pendants and earrings with real flowers set inside them.",
    src: "/images/pieces/forget-me-not-pendant.jpg",
    alt: "Round gold pendant holding a single pressed blue forget-me-not, on a fine gold chain",
    width: 1080,
    height: 1440,
  },
];

export default async function Home() {
  const featured = await getFeaturedPieces();

  return (
    <>
      {/* Art-directed preload. Only the crop and format that will actually be
          used is fetched, so the LCP path stays a single request. */}
      <link
        rel="preload"
        as="image"
        href="/images/hero/hero-16x9.avif"
        type="image/avif"
        media="(min-width: 768px)"
      />
      <link
        rel="preload"
        as="image"
        href="/images/hero/hero-4x5.avif"
        type="image/avif"
        media="(max-width: 767px)"
      />

      {/* 1 · Hero. The image and the headline, nothing else. */}
      <Hero />

      {/* 2 · Opening */}
      <section className="mx-auto max-w-content px-6 py-section md:px-10 md:py-section-lg">
        <Reveal className="max-w-prose">
          <p className="font-display text-display-lg text-ink">
            A rose lasts about a week. This one was picked three years ago and it looks the same as
            the day it went in.
          </p>
          <p className="mt-10 text-body-lg text-ink-muted">
            I make things that hold onto other things. Flowers people kept. Photographs. Sand
            somebody carried home from a beach.
          </p>
          <p className="mt-6 text-body-lg text-ink-muted">
            Most of what I make has existed once, because one person asked for it and nobody has
            asked for the same thing since.
          </p>
        </Reveal>
      </section>

      {/* 3 · The material. The one pinned section on the site. */}
      <MaterialSequence />

      {/* 4 · The process. The only numbered content on the site. */}
      <section className="mx-auto max-w-content px-6 py-section md:px-10 md:py-section-lg">
        <ProcessTimeline />
      </section>

      {/* 5 · Selected work.
          COPY GAP: tcr-copy.md gives four captions but never says which piece
          each belongs to, and all four are marked CONFIRM. Nothing is guessed
          here, so captions are absent until they are assigned. */}
      <section className="mx-auto max-w-content px-6 md:px-10">
        <Reveal className="max-w-prose">
          <p className="eyebrow text-ink-muted">Selected work</p>
          <h2 className="mt-6 font-display text-display-lg text-ink">
            Every one of these started as somebody&rsquo;s idea.
          </h2>
        </Reveal>

        <div className="mt-16 flex flex-col gap-16 md:mt-24 md:gap-24">
          {featured.map((piece, i) => (
            <Reveal key={piece.slug}>
              <Link
                href={`/gallery/${piece.slug}`}
                className={`group grid items-center gap-8 md:grid-cols-2 md:gap-16 ${
                  i % 2 === 1 ? "md:[&>figure]:order-2" : ""
                }`}
              >
                <figure>
                  <CuredImage
                    src={piece.images[0].src}
                    alt={piece.images[0].alt}
                    width={piece.images[0].width}
                    height={piece.images[0].height}
                    blurDataUrl={piece.images[0].blurDataUrl}
                    focal={focalPosition(piece.images[0])}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="w-full"
                  />
                </figure>
                <div>
                  <p className="eyebrow text-ink-muted">{piece.category}</p>
                  <p className="mt-4 font-display text-display-md text-ink">{piece.title}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 6 · What she makes. No prices. */}
      <section className="mx-auto max-w-content px-6 py-section md:px-10 md:py-section-lg">
        <div className="grid gap-12 md:grid-cols-3 md:gap-10">
          {MAKES.map((col, i) => (
            <Reveal key={col.title} delay={i * 80}>
              <CuredImage
                src={col.src}
                alt={col.alt}
                width={col.width}
                height={col.height}
                index={i}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="aspect-[4/5] w-full [&_img]:aspect-[4/5] [&_img]:w-full [&_img]:object-cover"
              />
              <h3 className="mt-8 font-display text-display-md text-ink">{col.title}</h3>
              <p className="mt-3 text-body text-ink-muted">{col.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 7 · The invitation */}
      <section className="mx-auto max-w-content px-6 pb-section md:px-10 md:pb-section-lg">
        <Reveal className="max-w-prose">
          <h2 className="font-display text-display-lg text-ink">
            Tell me what you&rsquo;re imagining.
          </h2>
          <p className="mt-10 text-body-lg text-ink-muted">
            Most of it starts with something you already have. A flower you kept. A photograph.
            Sometimes just a colour you can&rsquo;t get out of your head.
          </p>
          <p className="mt-6 text-body-lg text-ink-muted">
            Send me a message and I&rsquo;ll tell you whether it can be done.
          </p>
          <OrderButton className="mt-10" />
        </Reveal>
      </section>
    </>
  );
}
