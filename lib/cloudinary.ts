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

export { cloudinary };
