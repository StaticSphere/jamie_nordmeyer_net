/**
 * Generates favicon.ico (multi-size) and favicon.svg (base64-embedded)
 * from a source PNG using sharp (already a project dependency).
 *
 * Usage:
 *   node scripts/generate-favicons.mjs [source-image]
 *
 * Defaults to: avatar_512.png in project root
 * Outputs:     public/favicon.ico and public/favicon.svg
 */

import sharp from "sharp";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

const src = resolve(root, process.argv[2] ?? "avatar_512.png");
const icoOut = resolve(root, "public/favicon.ico");
const svgOut = resolve(root, "public/favicon.svg");

console.log(`Source : ${src}`);
console.log(`ICO out: ${icoOut}`);
console.log(`SVG out: ${svgOut}`);

// --- Build ICO (multi-size: 16, 32, 48) ---
// ICO format spec: https://en.wikipedia.org/wiki/ICO_(file_format)
const sizes = [16, 32, 48];

async function toPngBuffer(size) {
  return sharp(src)
    .resize(size, size, { fit: "cover", position: "center" })
    .png()
    .toBuffer();
}

function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = count * dirEntrySize;
  const dataOffset = headerSize + dirSize;

  const totalSize = dataOffset + pngBuffers.reduce((s, b) => s + b.length, 0);
  const buf = Buffer.alloc(totalSize);

  // ICO header
  buf.writeUInt16LE(0, 0);      // reserved
  buf.writeUInt16LE(1, 2);      // type: icon
  buf.writeUInt16LE(count, 4);  // image count

  let imageOffset = dataOffset;
  pngBuffers.forEach((png, i) => {
    const base = headerSize + i * dirEntrySize;
    const size = sizes[i];
    buf.writeUInt8(size === 256 ? 0 : size, base);      // width (0 = 256)
    buf.writeUInt8(size === 256 ? 0 : size, base + 1);  // height
    buf.writeUInt8(0, base + 2);                         // color palette count
    buf.writeUInt8(0, base + 3);                         // reserved
    buf.writeUInt16LE(1, base + 4);                      // color planes
    buf.writeUInt16LE(32, base + 6);                     // bits per pixel
    buf.writeUInt32LE(png.length, base + 8);             // image data size
    buf.writeUInt32LE(imageOffset, base + 12);           // image data offset
    png.copy(buf, imageOffset);
    imageOffset += png.length;
  });

  return buf;
}

// --- Build SVG (base64 embedded, circular clip) ---
async function buildSvg() {
  const png32 = await sharp(src)
    .resize(32, 32, { fit: "cover", position: "center" })
    .png()
    .toBuffer();
  const b64 = png32.toString("base64");
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <clipPath id="circle">
      <circle cx="16" cy="16" r="16"/>
    </clipPath>
  </defs>
  <image href="data:image/png;base64,${b64}" x="0" y="0" width="32" height="32" clip-path="url(#circle)"/>
</svg>`;
}

const [png16, png32, png48] = await Promise.all(sizes.map(toPngBuffer));
const ico = buildIco([png16, png32, png48]);
writeFileSync(icoOut, ico);
console.log("✓ favicon.ico written");

const svg = await buildSvg();
writeFileSync(svgOut, svg);
console.log("✓ favicon.svg written");

