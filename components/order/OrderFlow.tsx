"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Choices, Select, TextArea, TextInput } from "./fields";
import {
  COLLECTION_CITIES,
  COUNTRIES,
  OCCASIONS,
  PRODUCT_CONFIG,
  PRODUCT_TYPES,
  REFERENCE_CHOICES,
  SIZES,
  UPLOAD_MAX_BYTES,
  UPLOAD_TYPES,
  type ProductType,
} from "@/lib/order-config";
import { VIBES } from "@/lib/pieces";
import { uploadToCloudinary } from "@/lib/upload-client";

type RefPiece = {
  slug: string;
  title: string;
  image: { src: string; alt: string; width: number; height: number } | null;
};

const PHONE_RE = /^[+]?[\d][\d\s\-()]{6,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type State = {
  productType: string;
  productDetail: string;
  referenceType: "" | "gallery" | "picture" | "new";
  referencePieceSlug: string;
  referenceImageUrl: string;
  occasion: string;
  vibes: string[];
  letteringOn: "" | "yes" | "no";
  lettering: string;
  size: string;
  neededBy: string;
  noDate: boolean;
  budget: string;
  country: string;
  city: string;
  name: string;
  whatsapp: string;
  email: string;
  notes: string;
  website: string;
};

const EMPTY: State = {
  productType: "",
  productDetail: "",
  referenceType: "",
  referencePieceSlug: "",
  referenceImageUrl: "",
  occasion: "",
  vibes: [],
  letteringOn: "",
  lettering: "",
  size: "",
  neededBy: "",
  noDate: false,
  budget: "",
  country: "",
  city: "",
  name: "",
  whatsapp: "",
  email: "",
  notes: "",
  website: "",
};

type StepId =
  | "product"
  | "idea"
  | "occasion"
  | "feel"
  | "lettering"
  | "size"
  | "when"
  | "budget"
  | "where"
  | "name"
  | "whatsapp"
  | "email"
  | "notes";

type Step = {
  id: StepId;
  question: string;
  hint?: string;
  /** Hidden entirely when this returns false. */
  when?: (s: State) => boolean;
  /** Returns an error string to block Continue, or null. */
  validate?: (s: State) => string | null;
};

/**
 * Questions in the order tcr-copy.md sets out.
 *
 * FLAGGED, NOT CHANGED: occasion and feel are gated on "It's completely new",
 * exactly as the deck specifies, so anyone adapting a gallery piece is never
 * asked what the occasion is. Someone ordering a wedding gift based on an
 * existing piece cannot tell her it is for a wedding.
 */
const STEPS: Step[] = [
  {
    id: "product",
    question: "What would you like made?",
    validate: (s) => (s.productType ? null : "Pick one so I know where to start."),
  },
  { id: "idea", question: "Do you have something in mind?" },
  { id: "occasion", question: "What’s the occasion?", when: (s) => s.referenceType === "new" },
  {
    id: "feel",
    question: "What should it feel like?",
    hint: "Pick as many as you like.",
    when: (s) => s.referenceType === "new",
  },
  { id: "lettering", question: "Add a name, date, or lettering?" },
  { id: "size", question: "What size?", hint: "Rough is fine. We can work it out." },
  { id: "when", question: "When do you need it?" },
  {
    id: "budget",
    question: "What’s your budget?",
    hint: "This helps me suggest what’s possible. Nothing is fixed yet.",
  },
  {
    id: "where",
    question: "Where are you?",
    validate: (s) => (s.country ? null : "Pick where you are so I can work out delivery."),
  },
  {
    id: "name",
    question: "Your name",
    validate: (s) => (s.name.trim() ? null : "I’ll need a name to reply to."),
  },
  {
    id: "whatsapp",
    question: "WhatsApp number",
    hint: "This is how I’ll reply.",
    validate: (s) =>
      !s.whatsapp.trim()
        ? "I’ll need a number to reply to."
        : PHONE_RE.test(s.whatsapp.trim())
          ? null
          : "That doesn’t look right. Include your city code, or start with +92.",
  },
  {
    id: "email",
    question: "Email",
    hint: "I’ll send you a copy of this.",
    validate: (s) =>
      !s.email.trim() || EMAIL_RE.test(s.email.trim())
        ? null
        : "That email address doesn’t look complete.",
  },
  { id: "notes", question: "Anything else?" },
];

type Done = { reference: string; emailed: boolean; email: string };

export function OrderFlow({ initialPiece, onClose }: { initialPiece?: string; onClose: () => void }) {
  const reduce = useReducedMotion();

  const [s, setS] = useState<State>(() => ({
    ...EMPTY,
    referenceType: initialPiece ? "gallery" : "",
    referencePieceSlug: initialPiece ?? "",
  }));
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [refPiece, setRefPiece] = useState<RefPiece | null>(null);

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));

  // The gallery is database-backed now, so the attached piece has to be
  // fetched rather than read from a bundled list.
  useEffect(() => {
    const slug = s.referencePieceSlug;
    if (!slug) {
      setRefPiece(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/piece/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled) setRefPiece(j);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [s.referencePieceSlug]);

  const steps = useMemo(() => STEPS.filter((st) => (st.when ? st.when(s) : true)), [s]);
  const index = Math.min(i, steps.length - 1);
  const step = steps[index];
  const isLast = index === steps.length - 1;
  const progress = ((index + (done ? 1 : 0)) / steps.length) * 100;

  const go = useCallback(
    (delta: number) => {
      setError(null);
      setDir(delta);
      setI((prev) => Math.max(0, Math.min(steps.length - 1, prev + delta)));
    },
    [steps.length],
  );

  const submit = useCallback(async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: s.productType,
          productDetail: s.productDetail,
          referenceType: s.referenceType || undefined,
          referencePieceSlug: s.referencePieceSlug,
          referenceImageUrl: s.referenceImageUrl,
          occasion: s.occasion,
          vibes: s.vibes,
          lettering: s.letteringOn === "yes" ? s.lettering : "",
          size: s.size,
          neededBy: s.noDate ? "" : s.neededBy,
          budget: s.budget,
          country: s.country,
          city: s.city,
          name: s.name,
          whatsapp: s.whatsapp,
          email: s.email,
          notes: s.notes,
          website: s.website,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          j.error ?? "That didn’t send. Try again.",
        );
        return;
      }
      setDir(1);
      setDone({ reference: j.reference, emailed: Boolean(j.emailed), email: s.email });
    } catch {
      setError("That didn’t send. Try again.");
    } finally {
      setSending(false);
    }
  }, [s]);

  const advance = useCallback(() => {
    const bad = step?.validate?.(s) ?? null;
    if (bad) {
      setError(bad);
      return;
    }
    if (isLast) void submit();
    else go(1);
  }, [step, s, isLast, submit, go]);

  /** Picking an answer that reveals nothing new moves on by itself. */
  const pick = <K extends keyof State>(k: K, v: State[K], auto = false) => {
    set(k, v);
    setError(null);
    if (auto && !isLast) window.setTimeout(() => go(1), 340);
  };

  // Enter advances, except inside a textarea where it should make a new line.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || done || sending) return;
      const t = e.target as HTMLElement | null;
      if (t?.tagName === "TEXTAREA") return;
      e.preventDefault();
      advance();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, done, sending]);

  async function upload(file: File) {
    setUploadError(null);
    if (file.size > UPLOAD_MAX_BYTES) {
      setUploadError("That file is over 10MB. Try a smaller one.");
      return;
    }
    if (!UPLOAD_TYPES.includes(file.type)) {
      setUploadError("That needs to be a JPG or PNG.");
      return;
    }
    setUploading(true);
    try {
      const up = await uploadToCloudinary(
        file,
        "tcr/order-references",
        "Describe it in the last question instead.",
      );
      if ("error" in up) {
        setUploadError(up.error);
        return;
      }
      set("referenceImageUrl", up.url);
    } catch {
      setUploadError("That didn’t upload. Try again.");
    } finally {
      setUploading(false);
    }
  }

  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, y: d > 0 ? 28 : -28 }),
    center: { opacity: 1, y: 0 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, y: d > 0 ? -28 : 28 }),
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* A gold hairline is the only progress affordance. Gold is never a fill. */}
      <div className="fixed inset-x-0 top-0 z-10 h-px bg-line">
        <div
          className="h-px bg-gold transition-[width] duration-500 ease-reveal"
          style={{ width: `${done ? 100 : progress}%` }}
        />
      </div>

      <header className="flex items-center justify-between px-6 pt-10 md:px-12">
        <span className="font-display text-[1.25rem] leading-none tracking-eyebrow text-ink">
          TCR
        </span>
        <div className="flex items-center gap-8">
          {!done && (
            <span className="eyebrow text-ink-muted">
              {index + 1} of {steps.length}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="eyebrow text-ink-muted transition-colors duration-200 hover:text-ink"
          >
            Close
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center px-6 py-16 md:px-12">
        <div className="mx-auto w-full max-w-3xl">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={done ? "done" : step.id}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={
                reduce ? { duration: 0.15 } : { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
              }
            >
              {done ? (
                <div className="flex flex-col items-start gap-8">
                  <h1 className="font-display text-display-xl text-ink">Got it.</h1>
                  <p className="max-w-prose text-body-lg text-ink-muted">
                    Reference <span className="text-ink">{done.reference}</span>. I&rsquo;ll come
                    back to you in a day or two, sometimes longer if I&rsquo;m mid-pour, with what
                    it would cost and how long it would take.
                  </p>
                  {done.emailed && done.email && (
                    <p className="text-caption text-ink-muted">
                      I&rsquo;ve sent a copy to {done.email}.
                    </p>
                  )}
                  {/* No WhatsApp handoff. She contacts them, not the other way
                      round, so there is nothing for them to do here except go
                      back to looking at the work. */}
                  <a
                    href="/gallery"
                    className="eyebrow rounded-control border border-line px-7 py-4 text-ink transition-colors duration-200 hover:border-ink"
                  >
                    See the work
                  </a>
                </div>
              ) : (
                <>
                  <h1 className="font-display text-display-lg text-ink">{step.question}</h1>
                  {step.hint && <p className="mt-4 text-body text-ink-muted">{step.hint}</p>}

                  <div className="mt-12">
                    <StepBody
                      step={step}
                      s={s}
                      set={set}
                      pick={pick}
                      upload={upload}
                      uploading={uploading}
                      uploadError={uploadError}
                      refPiece={refPiece}
                    />
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {!done && (
        <footer className="sticky bottom-0 border-t border-line bg-canvas px-6 py-6 md:px-12">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-6">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={index === 0}
              className="eyebrow text-ink-muted transition-opacity duration-200 hover:text-ink disabled:pointer-events-none disabled:opacity-0"
            >
              Back
            </button>

            <div className="flex items-center gap-6">
              {error && (
                <p role="alert" className="text-caption text-rose">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={advance}
                disabled={sending}
                className="eyebrow rounded-control bg-ink px-7 py-4 text-canvas transition-opacity duration-200 hover:opacity-85 disabled:opacity-60"
              >
                {isLast ? (sending ? "Sending…" : "Send my idea") : "Continue"}
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Honeypot. Hidden, off the tab order, never announced. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={s.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </div>
    </div>
  );
}

function StepBody({
  step,
  s,
  set,
  pick,
  upload,
  uploading,
  uploadError,
  refPiece,
}: {
  step: Step;
  s: State;
  set: <K extends keyof State>(k: K, v: State[K]) => void;
  pick: <K extends keyof State>(k: K, v: State[K], auto?: boolean) => void;
  upload: (f: File) => Promise<void>;
  uploading: boolean;
  uploadError: string | null;
  refPiece: RefPiece | null;
}) {
  const piece = refPiece;
  const config = s.productType ? PRODUCT_CONFIG[s.productType as ProductType] : null;
  const collects = COLLECTION_CITIES.includes(s.city.trim().toLowerCase());

  switch (step.id) {
    case "product":
      return (
        <>
          <Choices
            name={step.question}
            options={PRODUCT_TYPES}
            value={s.productType}
            onChange={(v) => pick("productType", v, v !== "other")}
          />
          {s.productType === "other" && (
            <div className="mt-6">
              <TextInput
                autoFocus
                placeholder="Tell me what you have in mind"
                aria-label="Tell me what you have in mind"
                value={s.productDetail}
                onChange={(e) => set("productDetail", e.target.value)}
              />
            </div>
          )}
        </>
      );

    case "idea":
      return (
        <>
          <Choices
            name={step.question}
            options={REFERENCE_CHOICES}
            value={s.referenceType}
            onChange={(v) => pick("referenceType", v as State["referenceType"], v === "new")}
            columns="one"
          />

          {s.referenceType === "gallery" && piece?.image && (
            <div className="mt-6 flex items-center gap-5 border border-line p-4">
              <Image
                src={piece.image.src}
                alt={piece.image.alt}
                width={piece.image.width}
                height={piece.image.height}
                sizes="80px"
                className="shrink-0 object-cover"
                style={{ width: 80, height: 80 }}
              />
              <div className="flex flex-col gap-2">
                <p className="text-caption text-ink-muted">
                  Starting from: <span className="text-ink">{piece.title}</span>
                </p>
                <div className="flex gap-5">
                  <a href="/gallery" className="eyebrow text-ink-muted hover:text-ink">
                    Choose a different piece
                  </a>
                  <button
                    type="button"
                    onClick={() => set("referencePieceSlug", "")}
                    className="eyebrow text-ink-muted hover:text-ink"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {s.referenceType === "picture" && (
            <div className="mt-6">
              <input
                type="file"
                accept={UPLOAD_TYPES.join(",")}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload(f);
                }}
                className="block w-full text-caption text-ink-muted file:mr-4 file:rounded-control file:border file:border-line file:bg-transparent file:px-5 file:py-3 file:text-ink"
              />
              <p className="mt-3 text-caption text-ink-muted">JPG or PNG, up to 10MB.</p>
              {uploading && <p className="mt-2 text-caption text-ink-muted">Uploading…</p>}
              {s.referenceImageUrl && <p className="mt-2 text-caption text-ink">Picture attached.</p>}
              {uploadError && (
                <p role="alert" className="mt-2 text-caption text-rose">
                  {uploadError}
                </p>
              )}
            </div>
          )}
        </>
      );

    case "occasion":
      return (
        <Choices
          name={step.question}
          options={OCCASIONS.map((o) => ({ value: o, label: o }))}
          value={s.occasion}
          onChange={(v) => pick("occasion", v, true)}
        />
      );

    case "feel":
      return (
        <Choices
          multi
          name={step.question}
          options={VIBES.map((v) => ({ value: v, label: v }))}
          value={s.vibes}
          onChange={(v) =>
            set("vibes", s.vibes.includes(v) ? s.vibes.filter((x) => x !== v) : [...s.vibes, v])
          }
        />
      );

    case "lettering":
      return (
        <>
          <Choices
            name={step.question}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={s.letteringOn}
            onChange={(v) => pick("letteringOn", v as State["letteringOn"], v === "no")}
          />
          {s.letteringOn === "yes" && (
            <div className="mt-6">
              <TextInput
                autoFocus
                placeholder="What should it say?"
                aria-label="What should it say?"
                value={s.lettering}
                onChange={(e) => set("lettering", e.target.value)}
              />
              <p className="mt-3 text-caption text-ink-muted">
                Write it exactly as you&rsquo;d like it to appear.
              </p>
            </div>
          )}
        </>
      );

    case "size":
      return (
        <Choices
          name={step.question}
          options={SIZES.map((z) => ({
            value: z,
            label: z,
            // CONTENT GAP: the real-world reference per product type is not
            // written anywhere yet, so nothing renders under the label.
            note: config?.sizeReferences?.[z],
          }))}
          value={s.size}
          onChange={(v) => pick("size", v, true)}
        />
      );

    case "when":
      return (
        <div className="flex flex-col gap-5">
          <TextInput
            type="date"
            aria-label={step.question}
            disabled={s.noDate}
            value={s.neededBy}
            onChange={(e) => set("neededBy", e.target.value)}
          />
          <Choices
            name="No particular date"
            options={[{ value: "none", label: "No particular date" }]}
            value={s.noDate ? "none" : ""}
            onChange={() => set("noDate", !s.noDate)}
          />
          {/* CONTENT GAP: lead times per category do not exist yet. */}
          {config?.leadTime && <p className="text-caption text-ink-muted">{config.leadTime}</p>}
        </div>
      );

    case "budget":
      return config && config.budgetBands.length > 0 ? (
        <Choices
          name={step.question}
          options={config.budgetBands.map((b) => ({ value: b, label: b }))}
          value={s.budget}
          onChange={(v) => pick("budget", v, true)}
        />
      ) : (
        /* CONTENT GAP: no bands defined, so free text rather than invented
           price ranges. */
        <TextInput
          autoFocus
          aria-label={step.question}
          value={s.budget}
          onChange={(e) => set("budget", e.target.value)}
        />
      );

    case "where":
      return (
        <div className="flex flex-col gap-5">
          <Select
            aria-label="Country"
            value={s.country}
            onChange={(e) => set("country", e.target.value)}
          >
            <option value="">Country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <TextInput
            placeholder="City"
            aria-label="City"
            value={s.city}
            onChange={(e) => set("city", e.target.value)}
          />
          {collects && (
            <p className="text-caption text-ink-muted">
              You can collect from Islamabad, or I can send it.
            </p>
          )}
        </div>
      );

    case "name":
      return (
        <TextInput
          autoFocus
          autoComplete="name"
          aria-label={step.question}
          value={s.name}
          onChange={(e) => set("name", e.target.value)}
        />
      );

    case "whatsapp":
      return (
        <TextInput
          autoFocus
          type="tel"
          autoComplete="tel"
          aria-label={step.question}
          value={s.whatsapp}
          onChange={(e) => set("whatsapp", e.target.value)}
        />
      );

    case "email":
      return (
        <TextInput
          autoFocus
          type="email"
          autoComplete="email"
          aria-label={step.question}
          value={s.email}
          onChange={(e) => set("email", e.target.value)}
        />
      );

    case "notes":
      return (
        <TextArea
          autoFocus
          placeholder="Colours you love, colours you hate, anything you’re unsure about."
          aria-label={step.question}
          value={s.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      );
  }
}
