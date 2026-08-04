/**
 * Browser-side upload helpers. Shared by the image manager and the add-a-piece
 * modal so the two cannot drift.
 *
 * Files go straight to Cloudinary rather than through our own API, because a
 * Vercel function caps request bodies at 4.5MB.
 */

export type Uploaded = { url: string; width: number; height: number };

export async function uploadToCloudinary(
  file: File,
  folder: "tcr/order-references" | "tcr/pieces",
  /** Appended when uploads are switched off, so each caller can say what to do instead. */
  notConfiguredHint?: string,
): Promise<Uploaded | { error: string }> {
  const sigRes = await fetch("/api/upload-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  if (!sigRes.ok) {
    const j = await sigRes.json().catch(() => ({}));
    const base = j.error ?? "Uploads aren’t switched on yet.";
    return {
      error: j.code === "not_configured" && notConfiguredHint ? `${base} ${notConfiguredHint}` : base,
    };
  }
  const sig = await sigRes.json();

  // Every signed field is echoed back from the signature response, never from
  // this function's own arguments. Cloudinary recomputes the signature over
  // exactly what it receives, so the two have to agree byte for byte, and
  // sending our own `folder` here is what silently broke admin uploads.
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", String(sig.timestamp));
  fd.append("folder", sig.folder);
  fd.append("allowed_formats", sig.allowedFormats);
  fd.append("signature", sig.signature);

  const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: fd,
  });
  if (!up.ok) return { error: "That didn’t upload. Try again." };

  const j = await up.json();
  return { url: j.secure_url as string, width: j.width as number, height: j.height as number };
}

/**
 * The LQIP, generated here at upload time. This is the uncured state of the
 * cure transition, so the load and the animation are one gesture.
 */
export async function makeBlurDataUrl(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const w = 16;
    const h = Math.max(1, Math.round((bitmap.height * w) / bitmap.width));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.4);
  } catch {
    // A missing placeholder costs a nicer load, not a broken image.
    return "";
  }
}

/** "Black and gold clock" to "black-and-gold-clock". */
export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
