import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UPLOAD_FOLDERS, hasCloudinary, isUploadFolder, signUpload } from "@/lib/cloudinary";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Hands out a short-lived Cloudinary upload signature.
 *
 * Two callers with very different trust levels share this route. A customer
 * attaching a reference picture has no account and cannot be asked for one, so
 * "tcr/order-references" stays open to anyone and leans on the rate limit. The
 * admin's gallery uploads have no such excuse, so "tcr/pieces" requires a
 * session. Before this, one hardcoded folder was signed for both, which was
 * simultaneously a bug (the admin's uploads could never validate) and a gap
 * (nothing here checked who was asking).
 *
 * The folder arrives from the browser and is checked against a fixed map. It is
 * never interpolated, so there is nothing to traverse out of.
 */
export async function POST(req: Request) {
  if (!hasCloudinary) {
    return NextResponse.json(
      // Context-neutral. Two very different callers use this route, so the
      // "what to do instead" sentence belongs to each of them, not here.
      { error: "Uploads aren’t switched on yet.", code: "not_configured" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const folder = (body as { folder?: unknown }).folder;

  if (!isUploadFolder(folder)) {
    return NextResponse.json({ error: "That didn’t upload. Try again." }, { status: 400 });
  }

  if (UPLOAD_FOLDERS[folder] === "admin") {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { ok } = await checkRateLimit(`upload:${ip}`);
  if (!ok) {
    return NextResponse.json(
      { error: "That’s a lot of uploads. Try again shortly." },
      { status: 429 },
    );
  }

  return NextResponse.json(signUpload(folder));
}
