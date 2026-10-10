// Generates the sized WebP photos, avatars and logo variants the site serves.
// Sources stay untouched in public/assets/; output goes to public/assets/optimized/.
//   node scripts/optimize-images.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const src = "public/assets";
const out = "public/assets/optimized";
await mkdir(out, { recursive: true });

const photos = [
  ["landing-Frame26.png", "photo-park", [1920, 1200, 800], 78],
  ["landing-Frame30.png", "photo-sea", [1600, 900], 78],
  ["landing-Frame28.png", "photo-run", [1400, 800], 78],
  ["landing-Image8.png", "photo-team", [1600, 900], 78],
  [
    "landing-FosterAWorkplaceCultureThatEncouragesTeamwork.png",
    "photo-office",
    [1200, 700],
    78,
  ],
  ["contact-11.png", "avatar-1", [160], 82],
  ["contact-16.png", "avatar-2", [160], 82],
  ["contact-17.png", "avatar-3", [160], 82],
  ["contact-20.png", "avatar-4", [160], 82],
  ["contact-31.png", "avatar-5", [160], 82],
];

for (const [file, name, widths, quality] of photos) {
  for (const width of widths) {
    const target = `${out}/${name}-${width}.webp`;
    await sharp(`${src}/${file}`)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toFile(target);
    console.log("wrote", target);
  }
}

// Logo: trim the transparent padding, then make a light variant for the dark
// footer by keeping the coloured mark and recolouring the navy wordmark white.
const logo = `${src}/landing-Logo1.png`;
const box = { left: 190, top: 360, width: 1136, height: 272 };
const markWidth = 320; // mark occupies the left ~320px of the trimmed box

await sharp(logo)
  .extract(box)
  .resize({ height: 120 })
  .webp({ quality: 90, lossless: true })
  .toFile(`${out}/logo.webp`);
console.log("wrote", `${out}/logo.webp`);

const trimmed = sharp(logo).extract(box);
const mark = await trimmed
  .clone()
  .extract({ left: 0, top: 0, width: markWidth, height: box.height })
  .png()
  .toBuffer();
const wordmarkAlpha = await trimmed
  .clone()
  .extract({
    left: markWidth,
    top: 0,
    width: box.width - markWidth,
    height: box.height,
  })
  .png()
  .toBuffer();
const whiteWordmark = await sharp({
  create: {
    width: box.width - markWidth,
    height: box.height,
    channels: 4,
    background: "#ffffff",
  },
})
  .composite([{ input: wordmarkAlpha, blend: "dest-in" }])
  .png()
  .toBuffer();
// sharp always resizes before compositing, so compose at full size first.
const lightLogo = await sharp({
  create: {
    width: box.width,
    height: box.height,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    { input: mark, left: 0, top: 0 },
    { input: whiteWordmark, left: markWidth, top: 0 },
  ])
  .png()
  .toBuffer();
await sharp(lightLogo)
  .resize({ height: 120 })
  .webp({ quality: 90, lossless: true })
  .toFile(`${out}/logo-light.webp`);
console.log("wrote", `${out}/logo-light.webp`);
