import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Privacy | The Culture Resin",
  description:
    "What happens to your information when you send me an order or use this site. Written plainly.",
};

/**
 * The privacy page. Content is verbatim from tcr-privacy.md.
 *
 * Single column at prose width, headings in --ink, body in --ink-muted. No
 * display type, no images, no reveals, no cure transition. This is the one
 * page where the site stops performing, which is deliberate: it is what
 * someone reads while deciding whether to trust her with a photograph of their
 * child.
 *
 * Linked from the footer only.
 *
 * Written to GDPR standard. Pakistan has no enacted data protection law, but
 * she ships to Europe, and GDPR reaches controllers outside the EU who offer
 * goods to people inside it. The higher standard covers both, and covers the
 * Pakistani bill in advance if it ever passes.
 */

/**
 * Bump by hand when the content below changes. Deliberately not a dynamic
 * date: rendering today's date would claim the policy was revised every time
 * someone loaded the page, which is untrue and is the opposite of the
 * assurance this line exists to give.
 */
const LAST_UPDATED = "4 August 2026";

// The address for data questions and deletion requests. Shared with the
// footer, so the site cannot offer two different ways to reach her.

/**
 * CONFIRM against the build on the day anything changes. If a provider is
 * swapped out, this table is wrong the moment the deploy lands.
 * Verified against .env.example and the code: all five are in use.
 */
const PROCESSORS: [string, string][] = [
  ["Vercel", "Hosts the site. Server logs and IP addresses"],
  ["Neon", "Stores order details in a database"],
  ["Cloudinary", "Stores and delivers images, including anything you upload"],
  ["Resend", "Sends the confirmation email and my sign-in links"],
  ["Upstash", "Blocks spam by counting requests per IP address"],
];

function ContactEmail() {
  if (!CONTACT_EMAIL) {
    // Visible on purpose. A silently missing contact route is worse than an
    // obvious gap, because this page promises a way to reach her.
    return <span className="text-rose">[contact email not set]</span>;
  }
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="text-ink underline underline-offset-4">
      {CONTACT_EMAIL}
    </a>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-16 text-[1.375rem] font-medium text-ink">{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-8 text-body-lg font-medium text-ink">{children}</h3>;
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 text-body-lg text-ink-muted">{children}</p>;
}

/** Bold in this page's copy means emphasis, not a heavier weight on a dark ground. */
function Em({ children }: { children: React.ReactNode }) {
  return <strong className="font-normal text-ink">{children}</strong>;
}

export default function Privacy() {
  return (
    // data-no-ambience switches off the background layer. tcr-privacy.md asks
    // for no animation here: this is the one page where the site stops
    // performing.
    <section
      data-no-ambience
      className="mx-auto max-w-content px-6 pt-section pb-section md:px-10 md:pt-section-lg md:pb-section-lg"
    >
      <div className="max-w-prose">
        <h1 className="text-[2rem] font-medium text-ink">Privacy</h1>
        <p className="mt-3 text-caption text-ink-muted">Last updated {LAST_UPDATED}</p>

        <p className="mt-10 text-body-lg text-ink-muted">
          This explains what happens to your information when you send me an order or use this site.
          It&rsquo;s written plainly because I&rsquo;d rather you actually read it.
        </p>
        <Lead>
          The Culture Resin is run by Amna in Islamabad, Pakistan. If you have a question about any
          of this, email <ContactEmail />.
        </Lead>

        <H2>What I collect</H2>

        <H3>When you send an order</H3>
        <p className="mt-4 text-body-lg text-ink-muted">
          The form asks for your name, your WhatsApp number, and your city. Email is optional. It
          also asks what you&rsquo;d like made, roughly what size, when you need it, and what
          you&rsquo;re able to spend. You can upload a picture if you have one, and there&rsquo;s a
          box for anything else you want to tell me.
        </p>
        <Lead>
          I ask for a budget range so I can suggest what&rsquo;s actually possible. I don&rsquo;t
          show prices on this site because every piece is different.
        </Lead>

        <H3>When I reply</H3>
        <p className="mt-4 text-body-lg text-ink-muted">
          Most conversations continue on WhatsApp. Some go by email.
        </p>

        <H3>When you visit the site</H3>
        <p className="mt-4 text-body-lg text-ink-muted">
          My hosting provider records the usual technical information: which pages loaded, roughly
          where the request came from, and your IP address. This happens automatically and I
          don&rsquo;t use it to identify anyone.
        </p>

        <H2>What I do with it</H2>
        <Lead>
          I use your details to answer your order, quote a price, agree a design, make the piece,
          and get it to you. That&rsquo;s it.
        </Lead>
        <Lead>
          I don&rsquo;t sell your information. I don&rsquo;t share it with advertisers. I
          don&rsquo;t send marketing emails, because I don&rsquo;t have a mailing list.
        </Lead>
        <Lead>
          If you&rsquo;re in the EU or the UK, the legal basis is that processing is necessary to
          take steps at your request before entering a contract, and then to perform it. For the
          technical site data, the basis is my legitimate interest in keeping the site working and
          blocking abuse.
        </Lead>

        <H2>Pictures you send me</H2>
        <Lead>
          If you upload a photograph, I only use it to understand what you want and to make your
          piece.
        </Lead>
        <Lead>
          Sometimes those photographs have people in them. A picture of a child for a birth plate,
          for example.{" "}
          <Em>
            I will never put a photograph of a person, or a name or a date from a piece I made for
            you, on this website or on social media unless you tell me in writing that I can.
          </Em>{" "}
          If I want to show your piece, I&rsquo;ll ask first, and you can say no without it
          affecting anything.
        </Lead>
        <Lead>
          If you&rsquo;ve already said yes and change your mind, tell me and I&rsquo;ll take it
          down.
        </Lead>

        <H2>Who else handles it</H2>
        <Lead>
          Running the site means a few companies process information on my behalf. Each one only
          gets what it needs.
        </Lead>

        {/* Narrow enough for a phone, but guarded anyway: a table that makes the
            whole page scroll sideways is worse than one that scrolls itself. */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="eyebrow py-3 pr-6 text-ink-muted">Who</th>
                <th className="eyebrow py-3 text-ink-muted">What they handle</th>
              </tr>
            </thead>
            <tbody>
              {PROCESSORS.map(([who, what]) => (
                <tr key={who} className="border-b border-line align-top">
                  <td className="whitespace-nowrap py-4 pr-6 text-body text-ink">{who}</td>
                  <td className="py-4 text-body text-ink-muted">{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Lead>
          These providers store data outside Pakistan, including in the EU and the US. Where EU or
          UK data is involved, transfers rely on Standard Contractual Clauses or an equivalent
          safeguard in each provider&rsquo;s terms.
        </Lead>
        <Lead>
          <Em>A note about WhatsApp.</Em> If we carry on the conversation there, that chat sits on
          Meta&rsquo;s servers and is covered by Meta&rsquo;s privacy policy rather than mine. I
          can&rsquo;t change how Meta handles it. If you&rsquo;d rather not use WhatsApp, say so and
          we&rsquo;ll use email instead.
        </Lead>

        <H2>How long I keep it</H2>
        <Lead>
          <Em>If your order doesn&rsquo;t go ahead</Em>, I delete your details after twelve months.
        </Lead>
        <Lead>
          <Em>If it does</Em>, I keep the order and our correspondence for three years, so I can
          help if something breaks or you want a matching piece later. After that I delete it.
        </Lead>
        <Lead>
          <Em>Pictures you uploaded</Em> are deleted once your piece is finished, unless
          you&rsquo;ve told me I can keep showing it.
        </Lead>
        <Lead>
          <Em>Server logs</Em> are kept for about thirty days.
        </Lead>
        <Lead>
          If you want your information gone sooner, ask and I&rsquo;ll delete it, unless I&rsquo;m
          required to keep a record for tax.
        </Lead>

        <H2>What you can ask me to do</H2>
        <Lead>You can ask me to:</Lead>
        <ul className="mt-4 flex flex-col gap-2 text-body-lg text-ink-muted">
          {[
            "Tell you what information I hold about you",
            "Correct anything that’s wrong",
            "Delete it",
            "Send you a copy in a portable format",
            "Stop using it for a particular purpose",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden className="text-line">
                ·
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Lead>
          Email <ContactEmail /> and I&rsquo;ll deal with it within thirty days. I might ask a
          question or two to check it&rsquo;s really you.
        </Lead>
        <Lead>
          If you&rsquo;re in the EU or the UK and you think I&rsquo;ve handled this badly, you can
          complain to your national data protection authority.
        </Lead>

        <H2>Cookies</H2>
        <Lead>
          This site doesn&rsquo;t use tracking cookies, advertising pixels, or third-party
          analytics.
        </Lead>
        <Lead>
          The only thing stored in your browser is a session cookie when I sign in to manage the
          site, which is nothing to do with visitors.
        </Lead>

        <H2>Children</H2>
        <Lead>
          This site is meant for adults. I don&rsquo;t knowingly collect information about anyone
          under sixteen.
        </Lead>
        <Lead>
          I do make pieces involving children, like birth plates and keepsakes. In those cases the
          order comes from a parent or guardian, and any photograph is something they chose to send
          me.
        </Lead>

        <H2>Changes</H2>
        <Lead>
          If I change how any of this works, I&rsquo;ll update this page and change the date at the
          top.
        </Lead>
      </div>
    </section>
  );
}
