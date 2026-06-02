import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'public', 'novoicone.png');

try {
  await access(sourcePath);
} catch {
  console.error(
    `\n  ✗ Source icon not found at:\n      ${sourcePath}\n\n  Drop a square PNG (>=512px) at that path and re-run.\n`,
  );
  process.exit(1);
}

// Brand blue — used for the maskable background (which must be opaque per
// the Android spec) and for the manifest theme_color.
const BRAND_BLUE = { r: 55, g: 138, b: 221 };

// Pixels with every RGB channel below this threshold are treated as the
// flattened-corner artifact and made fully transparent. The artwork itself
// has no near-black areas, so this only erases the corners.
const BLACK_THRESHOLD = 30;

// Android launchers crop maskable icons into varied shapes. The artwork has
// to live inside the inner ~80% safe area to avoid being clipped; we render
// at 78% for a small breathing margin.
const MASKABLE_SAFE_RATIO = 0.78;

/**
 * Loads the source PNG, makes every near-black pixel fully transparent, and
 * returns a fresh RGBA PNG buffer that the export passes can reuse.
 */
async function buildCleanSource() {
  const { data, info } = await sharp(sourcePath)
    .ensureAlpha(1)
    .raw()
    .toBuffer({ resolveWithObject: true });

  let cleared = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (
      data[i] < BLACK_THRESHOLD &&
      data[i + 1] < BLACK_THRESHOLD &&
      data[i + 2] < BLACK_THRESHOLD
    ) {
      data[i + 3] = 0;
      cleared++;
    }
  }
  const total = info.width * info.height;
  console.log(
    `  ↻ cleared ${cleared.toLocaleString()} dark pixels (${((cleared / total) * 100).toFixed(2)}%) to transparent`,
  );

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/**
 * Plain exports keep the transparency — corners show whatever background
 * the launcher / browser tab paints behind the icon.
 */
async function exportPlain(buffer, size, fileName) {
  const out = path.join(root, 'public', fileName);
  await writeFile(
    out,
    await sharp(buffer)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toBuffer(),
  );
  console.log(`  ✓ ${fileName.padEnd(28)} ${size}×${size}`);
}

/**
 * Maskable exports require an opaque background (Android spec). The
 * transparent corners of the artwork are filled by the solid brand blue,
 * which matches the artwork's own background so the seam is invisible.
 */
async function exportMaskable(buffer, size, fileName) {
  const inner = Math.round(size * MASKABLE_SAFE_RATIO);
  const innerPng = await sharp(buffer)
    .resize(inner, inner, { fit: 'cover' })
    .png()
    .toBuffer();
  const out = path.join(root, 'public', fileName);
  await writeFile(
    out,
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { ...BRAND_BLUE, alpha: 1 },
      },
    })
      .composite([{ input: innerPng, gravity: 'center' }])
      .png()
      .toBuffer(),
  );
  console.log(`  ✓ ${fileName.padEnd(28)} ${size}×${size} (maskable, blue base)`);
}

console.log(`\n  Source: ${path.relative(root, sourcePath)}`);

const clean = await buildCleanSource();

await exportPlain(clean, 192, 'icon-192.png');
await exportPlain(clean, 512, 'icon-512.png');
await exportPlain(clean, 180, 'apple-touch-icon.png');
await exportPlain(clean, 32, 'favicon-32.png');
await exportMaskable(clean, 512, 'icon-maskable-512.png');

console.log('\n  Done.\n');
