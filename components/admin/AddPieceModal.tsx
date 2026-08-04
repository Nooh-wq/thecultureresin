"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { FocalPicker } from "./FocalPicker";
import { createPieceWithImages, type NewPieceState } from "@/app/admin/actions";
import { makeBlurDataUrl, slugify, uploadToCloudinary } from "@/lib/upload-client";

const CATEGORIES = [
  ["CLOCKS", "Clocks"],
  ["TABLES", "Tables"],
  ["TRAYS", "Trays"],
  ["WALL_ART", "Wall art"],
  ["JEWELLERY", "Jewellery"],
  ["KEEPSAKES", "Keepsakes"],
] as const;

const VIBES = [
  ["OCEANIC", "Oceanic"],
  ["BOTANICAL", "Botanical"],
  ["DRAMATIC", "Dramatic"],
  ["SOFT", "Soft"],
  ["MINIMAL", "Minimal"],
  ["PLAYFUL", "Playful"],
  ["TRADITIONAL", "Traditional"],
] as const;

/**
 * No alt here. One description covers every photograph of a piece, and is
 * applied to all of them on submit.
 *
 * Asking per image meant five photographs of one clock demanded five separate
 * descriptions, which is the kind of friction that ends with "resin art 4"
 * typed five times. A screen reader hearing the same sentence for each angle
 * of the same object is a much smaller problem than no real description at
 * all. Individual wording is still available afterwards, per image, on the
 * piece's own page.
 */
type Draft = {
  key: string;
  url: string;
  width: number;
  height: number;
  blurDataUrl: string;
  focalX: number;
  focalY: number;
};

const field =
  "w-full rounded-control border border-line bg-surface px-4 py-3 text-body text-ink " +
  "placeholder:text-ink-muted focus:border-rose focus:outline-none";

/**
 * Everything needed to publish a piece, in one place.
 *
 * The old flow created a piece from three fields and then made you find it
 * again to add a photograph, which meant the gallery briefly contained
 * imageless entries.
 */
export function AddPieceModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<NewPieceState, FormData>(
    createPieceWithImages,
    {},
  );

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [images, setImages] = useState<Draft[]>([]);
  /** One sentence, applied to every photograph of this piece. */
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    setOpen(false);
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setImages([]);
    // Otherwise the next piece opens carrying the last one's description, and
    // a stale description is worse than an empty one: it looks deliberate.
    setDescription("");
    router.refresh();
  }, [state.ok, router]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function addFiles(files: FileList) {
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const blurDataUrl = await makeBlurDataUrl(file);
        const up = await uploadToCloudinary(
          file,
          "tcr/pieces",
          "Set the Cloudinary keys in .env.local first.",
        );
        if ("error" in up) {
          setUploadError(up.error);
          return;
        }
        setImages((prev) => [
          ...prev,
          {
            key: `${up.url}-${prev.length}`,
            url: up.url,
            width: up.width,
            height: up.height,
            blurDataUrl,
            focalX: 0.5,
            focalY: 0.5,
          },
        ]);
      }
    } finally {
      setUploading(false);
    }
  }

  const patch = (key: string, next: Partial<Draft>) =>
    setImages((prev) => prev.map((i) => (i.key === key ? { ...i, ...next } : i)));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="eyebrow rounded-control bg-ink px-5 py-3 text-canvas transition-opacity duration-200 hover:opacity-85"
      >
        Add a piece
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] overflow-y-auto bg-canvas/85 md:py-10"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Add a piece"
            onClick={(e) => e.stopPropagation()}
            className="mx-auto min-h-full w-full max-w-3xl border-line bg-canvas px-6 py-10 outline-none md:min-h-0 md:border md:px-10"
          >
            <div className="mb-10 flex items-start justify-between gap-6">
              <h2 className="font-display text-display-md text-ink">Add a piece</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="eyebrow shrink-0 text-ink-muted hover:text-ink"
              >
                Close
              </button>
            </div>

            <form action={action} className="flex flex-col gap-8">
              {/* The one description is stamped onto every image here, so the
                  server still receives an alt per image and its validation is
                  unchanged. */}
              <input
                type="hidden"
                name="images"
                value={JSON.stringify(
                  images.map((i) => ({ ...i, alt: description.trim() })),
                )}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="eyebrow text-ink-muted">Title</span>
                  <input
                    name="title"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!slugTouched) setSlug(slugify(e.target.value));
                    }}
                    className={field}
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="eyebrow text-ink-muted">Slug</span>
                  <input
                    name="slug"
                    required
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(slugify(e.target.value));
                    }}
                    className={field}
                  />
                  <span className="text-caption text-ink-muted">
                    Its web address. Filled in from the title.
                  </span>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="eyebrow text-ink-muted">Category</span>
                  <select name="category" defaultValue="KEEPSAKES" className={field}>
                    {CATEGORIES.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="eyebrow text-ink-muted">Order in the gallery</span>
                  <input name="sortOrder" type="number" defaultValue={0} className={field} />
                </label>
              </div>

              <fieldset className="border-0 p-0">
                <legend className="eyebrow mb-3 text-ink-muted">What it feels like</legend>
                <div className="flex flex-wrap gap-2">
                  {VIBES.map(([v, l]) => (
                    <label
                      key={v}
                      className="cursor-pointer rounded-control border border-line px-4 py-2 text-caption text-ink-muted has-[:checked]:border-rose has-[:checked]:text-ink"
                    >
                      <input type="checkbox" name="vibes" value={v} className="sr-only" />
                      {l}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Named so it cannot be confused with the photograph
                  description below. Both used to read as "the description",
                  and the wrong one got filled in, which is a labelling
                  failure rather than a user one. */}
              <label className="flex flex-col gap-2">
                <span className="eyebrow text-ink-muted">
                  Story note · shown on the piece
                </span>
                <input name="storyNote" maxLength={140} className={field} />
                <span className="text-caption text-ink-muted">
                  Your words, 140 characters at most. This is the sentence visitors read when
                  they open the piece. Leave it empty rather than filling it in for the sake of
                  it.
                </span>
              </label>

              <div className="grid gap-5 sm:grid-cols-3">
                <label className="flex flex-col gap-2">
                  <span className="eyebrow text-ink-muted">Dimensions</span>
                  <input name="dimensions" className={field} />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="eyebrow text-ink-muted">Materials</span>
                  <input name="materials" className={field} />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="eyebrow text-ink-muted">Lead time</span>
                  <input name="leadTime" className={field} />
                </label>
              </div>

              {/* Images ------------------------------------------------ */}
              <div className="flex flex-col gap-5 border-t border-line pt-8">
                <div>
                  <p className="eyebrow text-ink-muted">Photographs</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploading}
                    onChange={(e) => e.target.files && void addFiles(e.target.files)}
                    className="mt-3 block w-full text-caption text-ink-muted file:mr-4 file:rounded-control file:border file:border-line file:bg-transparent file:px-4 file:py-2 file:text-ink"
                  />
                  {uploading && <p className="mt-2 text-caption text-ink-muted">Uploading…</p>}
                  {uploadError && (
                    <p role="alert" className="mt-2 text-caption text-rose">
                      {uploadError}
                    </p>
                  )}
                </div>

                {/* One description for the whole piece, not one per file.
                    Sits above the thumbnails because it describes all of them. */}
                {images.length > 0 && (
                  <label className="flex flex-col gap-2">
                    <span className="eyebrow text-ink-muted">
                      Photograph description · not shown on the page
                    </span>
                    <input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      minLength={10}
                      placeholder="black and gold resin wall clock with gold Roman numerals"
                      className={field}
                    />
                    <span className="text-caption text-ink-muted">
                      Not the story note. Nobody reads this on the page: it is what a screen
                      reader announces and how the piece gets found in search, so describe what
                      the object looks like. One covers every photograph here, and an
                      individual one can be reworded later by opening the piece.
                    </span>
                  </label>
                )}

                {images.map((img) => (
                  <div key={img.key} className="flex flex-col gap-4 border border-line p-5">
                    <FocalPicker
                      src={img.url}
                      alt=""
                      x={img.focalX}
                      y={img.focalY}
                      onChange={(x, y) => patch(img.key, { focalX: x, focalY: y })}
                    />

                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((i) => i.key !== img.key))}
                      className="eyebrow self-start text-ink-muted hover:text-rose"
                    >
                      Remove this image
                    </button>
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-3">
                <input type="checkbox" name="published" defaultChecked className="accent-rose" />
                <span className="eyebrow text-ink-muted">Show it on the site straight away</span>
              </label>

              {state.error && (
                <p role="alert" className="text-caption text-rose">
                  {state.error}
                </p>
              )}

              <div className="flex items-center gap-6">
                <button
                  type="submit"
                  disabled={pending}
                  className="eyebrow rounded-control bg-ink px-6 py-3 text-canvas hover:opacity-85 disabled:opacity-60"
                >
                  {pending ? "Saving…" : "Add the piece"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="eyebrow text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
