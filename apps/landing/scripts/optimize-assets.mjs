import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

// Keep original Figma exports intact and serve lighter, visually faithful copies.
const manifest = JSON.parse(await readFile("src/assets.json", "utf8"));
await mkdir("public/assets/optimized", { recursive: true });
let before = 0;
let after = 0;
for (const page of Object.values(manifest)) {
  for (const [key, url] of Object.entries(page)) {
    if (!url.endsWith(".png")) continue;
    if (key.startsWith("imgYoungAfrican")) continue;
    const source = await readFile(`public${url}`);
    const filename = path.basename(url, ".png") + ".webp";
    const image = await sharp(source)
      .webp({ lossless: true, effort: 0 })
      .toBuffer();
    await writeFile(`public/assets/optimized/${filename}`, image);
    if (image.length < source.length)
      page[key] = `/assets/optimized/${filename}`;
    before += source.length;
    after += Math.min(image.length, source.length);
  }
}
await writeFile("src/assets.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `Lossless imagery: ${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB.`,
);
