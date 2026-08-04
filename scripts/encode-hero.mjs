import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Encodes the hero to AVIF and WebP.
 *
 * next/image cannot art-direct, and the hero needs two different crops at two
 * breakpoints, so it is served through a real <picture>. That means the format
 * variants have to exist as files rather than being generated on request.
 *
 *   node scripts/encode-hero.mjs
 *
 * Re-run after replacing either hero crop.
 */

const HERO = path.join(process.cwd(), "public", "images", "hero");
const SOURCES = ["hero-16x9.png", "hero-4x5.png"];

for (const file of SOURCES) {
  const src = path.join(HERO, file);
  const base = file.replace(/\.png$/, "");
  const meta = await sharp(src).metadata();

  // Quality tuned for photographic content with large smooth gradients, which
  // is what the silk is. Banding shows up there before it shows anywhere else.
  try {
    await sharp(src).avif({ quality: 58, effort: 6 }).toFile(path.join(HERO, `${base}.avif`));
  } catch (e) {
    console.log(`  AVIF unavailable for ${base}: ${e.message}`);
  }
  await sharp(src).webp({ quality: 78 }).toFile(path.join(HERO, `${base}.webp`));

  const kb = async (ext) => {
    try {
      return `${Math.round((await stat(path.join(HERO, `${base}.${ext}`))).size / 1024)}KB`;
    } catch {
      return "-";
    }
  };

  console.log(
    `${base}  ${meta.width}x${meta.height}   png ${await kb("png")}   avif ${await kb(
      "avif",
    )}   webp ${await kb("webp")}`,
  );
}

console.log(`\n${(await readdir(HERO)).join("  ")}`);
