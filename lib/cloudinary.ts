import { v2 as cloudinary } from "cloudinary";

export const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * The only folders anything is allowed to upload into.
 *
 * "public" means an unauthenticated visitor may request a signature for it,
 * because a customer attaching a reference picture has no account. "admin"
 * means the route demands a session first.
 */
export const UPLOAD_FOLDERS = {
  "tcr/order-references": "public",
  "tcr/pieces": "admin",
} as const;

export type UploadFolder = keyof typeof UPLOAD_FOLDERS;

export function isUploadFolder(v: unknown): v is UploadFolder {
  return typeof v === "string" && v in UPLOAD_FOLDERS;
}

/**
 * Formats Cloudinary will accept. Signed, so the browser cannot widen it.
 *
 * heic and heif are here because iPhones shoot HEIC by default and a customer
 * photographing a keepsake on a phone is the common case, not the edge case.
 */
const ALLOWED_FORMATS = "jpg,jpeg,png,webp,heic,heif";

/**
 * Signature for a direct browser-to-Cloudinary upload.
 *
 * This is not a style preference. The form advertises uploads "up to 10MB" and
 * a Vercel serverless function caps request bodies at 4.5MB, so routing the
 * file through /api/order would fail at roughly half the advertised size, as an
 * opaque 413. The browser uploads straight to Cloudinary and only the resulting
 * URL is posted to our API.
 *
 * Every signed parameter has to be sent back by the browser byte for byte or
 * Cloudinary rejects the upload. That is exactly how the admin's image upload
 * was broken: this signed a hardcoded "tcr/order-references" while both admin
 * uploaders sent "tcr/pieces", so the signature never matched and adding a
 * photograph to a piece failed every time. The folder is a real argument now,
 * and the caller echoes back what it is given rather than its own idea of it.
 */
export function signUpload(folder: UploadFolder) {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, allowed_formats: ALLOWED_FORMATS },
    process.env.CLOUDINARY_API_SECRET as string,
  );
  return {
    timestamp,
    folder,
    allowedFormats: ALLOWED_FORMATS,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
  };
}

/**
 * Recovers the public_id Cloudinary needs for a delete, from the URL we store.
 *
 * We save secure_url and nothing else, so the id has to be parsed back out:
 *
 *   https://res.cloudinary.com/recy3ixe/image/upload/v1785809703/tcr/pieces/abc.png
 *                                                               ^^^^^^^^^^^^^^^^ public_id is tcr/pieces/abc
 *
 * Returns null for anything that is not a Cloudinary URL, which is the normal
 * case for the eight seeded pieces: those are local files under /public and
 * must never be handed to a delete call.
 *
 * Transformation segments sit between "upload" and the version, so skipping to
 * the v<digits> segment drops them. Our own uploads never carry
 * transformations and always carry a version, so the fallback below only
 * matters for a URL someone pasted in by hand.
 */
export function cloudinaryPublicId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== "res.cloudinary.com") return null;

  const parts = parsed.pathname.split("/").filter(Boolean);
  const uploadAt = parts.indexOf("upload");
  if (uploadAt === -1) return null;

  let rest = parts.slice(uploadAt + 1);
  const versionAt = rest.findIndex((s) => /^v\d+$/.test(s));
  if (versionAt !== -1) rest = rest.slice(versionAt + 1);
  if (rest.length === 0) return null;

  // Only the final segment carries an extension; folders never do.
  return rest.join("/").replace(/\.[a-z0-9]+$/i, "");
}

/**
 * Removes images from Cloudinary after their database rows are gone.
 *
 * Deleting a piece used to leave its photographs on Cloudinary forever. They
 * cost storage, and because nothing references them any more there is no way
 * to find them again except by scrolling the Cloudinary dashboard.
 *
 * Deliberately never throws. This runs after the database delete has already
 * succeeded, so the piece is off the site either way; a Cloudinary outage
 * should not turn a completed delete into an error page. The worst case is the
 * orphan we already had, and it is logged.
 *
 * Batched: delete_resources takes up to 100 ids in one call, so a piece with a
 * dozen photographs is one request rather than a dozen.
 */
export async function deleteCloudinaryImages(urls: string[]): Promise<void> {
  if (!hasCloudinary) return;

  const ids = urls
    .map(cloudinaryPublicId)
    .filter((id): id is string => Boolean(id));

  if (ids.length === 0) return;

  try {
    await cloudinary.api.delete_resources(ids);
  } catch (e) {
    console.error(
      `[cloudinary] could not delete ${ids.length} image(s), now orphaned: ${ids.join(", ")}`,
      e,
    );
  }
}

export { cloudinary };
