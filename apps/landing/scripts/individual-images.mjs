// Compressed copies of the photos used on the individual page.
// Run: node scripts/individual-images.mjs
import sharp from "sharp";

const out = "public/assets/individual";
const jobs = [
  // Feed board
  [
    "public/assets/optimized/hero-fresh-community.webp",
    "community-1200.webp",
    1200,
  ],
  ["public/assets/optimized/hero-fresh-reset.webp", "gym-800.webp", 800],
  // Photo arc thumbnails
  ...[
    "public/assets/optimized/hero-fresh-outdoor.webp",
    "public/assets/photos/app-v2-800.webp",
    "public/assets/optimized/photo-park-800.webp",
    "public/assets/photos/why-v3-800.webp",
    "public/assets/optimized/photo-office-700.webp",
    "public/assets/optimized/hero-fresh-community.webp",
    "public/assets/photos/hero-team-640.webp",
    "public/assets/optimized/hero-fresh-reset.webp",
    "public/assets/photos/funmi-800.webp",
    "public/assets/optimized/photo-run-800.webp",
    "public/assets/photos/amara-800.webp",
  ].map((src, i) => [
    src,
    `arc-${String(i + 1).padStart(2, "0")}.webp`,
    300,
    400,
  ]),
];

for (const [src, name, width, height] of jobs) {
  const info = await sharp(src)
    .resize(height ? { width, height, fit: "cover" } : { width })
    .webp({ quality: 78 })
    .toFile(`${out}/${name}`);
  console.log(name, info.width, info.height, info.size);
}
