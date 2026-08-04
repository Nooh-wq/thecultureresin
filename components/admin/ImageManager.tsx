"use client";

import { useState } from "react";
import { FocalPicker } from "./FocalPicker";
import { addPieceImage, deletePieceImage, updatePieceImage } from "@/app/admin/actions";
import { makeBlurDataUrl, uploadToCloudinary } from "@/lib/upload-client";

type Img = {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  focalX: number;
  focalY: number;
  sortOrder: number;
};

export function ImageManager({ pieceId, images }: { pieceId: string; images: Img[] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    url: string;
    width: number;
    height: number;
    blurDataUrl: string;
  } | null>(null);
  const [pendingFocal, setPendingFocal] = useState({ x: 0.5, y: 0.5 });

  async function onFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const blurDataUrl = await makeBlurDataUrl(file);
      const up = await uploadToCloudinary(
        file,
        "tcr/pieces",
        "Set the Cloudinary keys in .env.local first.",
      );
      if ("error" in up) {
        setError(up.error);
        return;
      }
      setPending({ url: up.url, width: up.width, height: up.height, blurDataUrl });
      setPendingFocal({ x: 0.5, y: 0.5 });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="eyebrow text-ink-muted">Add an image</p>
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
          }}
          className="mt-3 block w-full text-caption text-ink-muted file:mr-4 file:rounded-control file:border file:border-line file:bg-transparent file:px-4 file:py-2 file:text-ink"
        />
        {busy && <p className="mt-2 text-caption text-ink-muted">Uploading…</p>}
        {error && (
          <p role="alert" className="mt-2 text-caption text-rose">
            {error}
          </p>
        )}
      </div>

      {pending && (
        <form action={addPieceImage} className="flex flex-col gap-5 border border-line p-5">
          <input type="hidden" name="pieceId" value={pieceId} />
          <input type="hidden" name="url" value={pending.url} />
          <input type="hidden" name="width" value={pending.width} />
          <input type="hidden" name="height" value={pending.height} />
          <input type="hidden" name="blurDataUrl" value={pending.blurDataUrl} />
          <input type="hidden" name="sortOrder" value={images.length} />

          <label className="flex flex-col gap-2">
            <span className="eyebrow text-ink-muted">Describe it (required)</span>
            <input
              name="alt"
              required
              minLength={10}
              placeholder="black and gold resin wall clock with gold Roman numerals"
              className="rounded-control border border-line bg-surface px-4 py-3 text-body text-ink placeholder:text-ink-muted focus:border-rose focus:outline-none"
            />
            <span className="text-caption text-ink-muted">
              This is how the site gets found, and it is the only thing a screen reader receives.
              Not &ldquo;resin art 4&rdquo;.
            </span>
          </label>

          <FocalPicker
            src={pending.url}
            alt=""
            x={pendingFocal.x}
            y={pendingFocal.y}
            onChange={(x, y) => setPendingFocal({ x, y })}
          />

          <div className="flex gap-4">
            <button
              type="submit"
              className="eyebrow rounded-control bg-ink px-5 py-2.5 text-canvas hover:opacity-85"
            >
              Add image
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="eyebrow text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <ul className="flex flex-col gap-6">
        {images.map((img) => (
          <li key={img.id}>
            <ImageRow img={img} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImageRow({ img }: { img: Img }) {
  const [focal, setFocal] = useState({ x: img.focalX, y: img.focalY });

  return (
    <form
      action={async (fd: FormData) => {
        await updatePieceImage(img.id, fd);
      }}
      className="flex flex-col gap-5 border border-line p-5"
    >
      <label className="flex flex-col gap-2">
        <span className="eyebrow text-ink-muted">Description</span>
        <input
          name="alt"
          required
          minLength={10}
          defaultValue={img.alt}
          className="rounded-control border border-line bg-surface px-4 py-3 text-body text-ink focus:border-rose focus:outline-none"
        />
      </label>

      <FocalPicker
        src={img.url}
        alt={img.alt}
        x={focal.x}
        y={focal.y}
        onChange={(x, y) => setFocal({ x, y })}
      />

      <div className="flex flex-wrap items-end gap-6">
        <label className="flex flex-col gap-2">
          <span className="eyebrow text-ink-muted">Order</span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={img.sortOrder}
            className="w-24 rounded-control border border-line bg-surface px-3 py-2 text-caption text-ink focus:border-rose focus:outline-none"
          />
        </label>

        <button
          type="submit"
          className="eyebrow rounded-control border border-line px-5 py-2.5 text-ink hover:border-ink"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => void deletePieceImage(img.id)}
          className="eyebrow text-ink-muted hover:text-rose"
        >
          Remove
        </button>
      </div>
    </form>
  );
}
