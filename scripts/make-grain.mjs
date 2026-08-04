import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Generates the tiling grain texture used behind the whole site.
 *
 *   node scripts/make-grain.mjs
 *
 * A large flat expanse of #1C1315 reads as dead pixel rather than as a
 * surface. A little tooth fixes that more convincingly than movement does,
 * and it costs one small tiled image and no animation at all.
 *
 * White speckle with random alpha, so it can sit over any colour and be dialled
 * with opacity alone. Deliberately not mix-blend-mode: a blend mode on a
 * fixed, full-viewport layer forces compositing on every scroll, which is the
 * opposite of what this site's performance budget wants.
 */

const SIZE = 128;
const OUT = path.join(process.cwd(), "public", "brand", "grain.png");

const px = Buffer.alloc(SIZE * SIZE * 4);
for (let i = 0; i < SIZE * SIZE; i++) {
  // Sparse: most pixels fully transparent, a minority carrying faint light.
  const lit = Math.random() < 0.5;
  const a = lit ? Math.floor(Math.random() * 90) : 0;
  px[i * 4] = 255;
  px[i * 4 + 1] = 255;
  px[i * 4 + 2] = 255;
  px[i * 4 + 3] = a;
}

const buf = await sharp(px, { raw: { width: SIZE, height: SIZE, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toBuffer();

await writeFile(OUT, buf);
console.log(`grain.png  ${SIZE}x${SIZE}  ${(buf.length / 1024).toFixed(1)}KB`);
