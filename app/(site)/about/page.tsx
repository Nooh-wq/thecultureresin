import type { Metadata } from "next";
import Link from "next/link";
import { CuredImage } from "@/components/CuredImage";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About Amna | The Culture Resin",
  description:
    "Four years of self-taught resin work from one room in Islamabad. Almost nothing gets made twice.",
};

export default function About() {
  return (
    <>
      <section className="mx-auto max-w-content px-6 pt-section md:px-10 md:pt-section-lg">
        <Reveal>
          <p className="eyebrow text-ink-muted">About</p>
          <h1 className="mt-6 font-display text-display-lg text-ink">Amna</h1>
          <p className="mt-3 text-body text-ink-muted">Islamabad, Pakistan</p>
        </Reveal>
      </section>

      {/* How it started */}
      <section className="mx-auto max-w-content px-6 py-section md:px-10 md:py-section-lg">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <Reveal>
            <p className="text-body-lg text-ink-muted">
              Four years ago I watched a video of someone pouring resin and thought it looked easy.
              It wasn&rsquo;t. The first piece I made had bubbles all the way through it and a soft
              patch in the middle that never properly set. I still have it somewhere.
            </p>
            <p className="mt-6 text-body-lg text-ink-muted">
              Nobody taught me. There was no one here I could have asked at the time, so I learned
              off the internet and by getting it wrong, mostly the second one.
            </p>
            <p className="mt-6 text-body-lg text-ink-muted">
              It was supposed to be a hobby. Then people started asking to buy things, and at some
              point I stopped calling it a hobby.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <CuredImage
              src="/images/pieces/daisy-silver-earrings.jpg"
              alt="Pair of oxidised silver drop earrings with bead fringe, each set with a deep blue resin panel holding a pressed white daisy"
              width={1080}
              height={1440}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="w-full"
            />
          </Reveal>
        </div>
      </section>

      {/* Why resin */}
      <section className="mx-auto max-w-content px-6 pb-section md:px-10 md:pb-section-lg">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <Reveal delay={120} className="md:order-2">
            <p className="text-body-lg text-ink-muted">
              Resin keeps things the way they already are. A flower that goes in with a torn petal
              comes out with the same torn petal. It doesn&rsquo;t tidy anything up or improve on
              it. That&rsquo;s most of why I use it.
            </p>
            <p className="mt-6 text-body-lg text-ink-muted">
              The other reason is that I can&rsquo;t take it back. Once it&rsquo;s poured, whatever
              I did is in there.
            </p>
          </Reveal>

          <Reveal className="md:order-1">
            <CuredImage
              src="/images/pieces/forget-me-not-pendant.jpg"
              alt="Round gold pendant holding a single pressed blue forget-me-not on a pearl white ground, ringed with small clear crystals"
              width={1080}
              height={1440}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="w-full"
            />
          </Reveal>
        </div>
      </section>

      {/* Pull quote, set large, alone on the canvas.
          CONFIRM: this is a placeholder in tcr-copy.md. Replace with something
          she actually says. */}
      <section className="mx-auto max-w-content px-6 pb-section md:px-10 md:pb-section-lg">
        <Reveal>
          <blockquote className="max-w-[20ch] font-display text-display-xl text-ink">
            Every piece I&rsquo;ve ruined, I ruined in the first ten minutes.
          </blockquote>
        </Reveal>
      </section>

      {/* How she works now */}
      <section className="mx-auto max-w-content px-6 pb-section md:px-10 md:pb-section-lg">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <Reveal>
            <p className="text-body-lg text-ink-muted">
              Almost nothing gets made twice. Someone sends me a photograph, or a flower in an
              envelope, or a colour, and we work out from there what it should be.
            </p>
            <p className="mt-6 text-body-lg text-ink-muted">
              They&rsquo;ve gone to the US, Canada, a few to Europe, and quite a lot around the
              Gulf. All of them were made in one room in Islamabad.
            </p>

            {/* About's job is trust. Pushing to the form here undercuts that. */}
            <Link
              href="/gallery"
              className="eyebrow mt-12 inline-block rounded-control border border-line px-6 py-3 text-ink transition-colors duration-200 hover:border-ink"
            >
              See the work
            </Link>
          </Reveal>

          <Reveal delay={120}>
            <CuredImage
              src="/images/pieces/teal-serving-tray.jpg"
              alt="Wave-edged teal resin serving tray with a swirled pearlescent surface and black and gold handles"
              width={1440}
              height={1440}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="w-full"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
