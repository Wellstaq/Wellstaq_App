import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const names = [
  "arrow-right-01",
  "heart",
  "activity",
  "people",
  "calendar",
  "shield-tick",
  "magic-star",
  "cup",
  "notification",
  "chart",
  "lock",
  "message-text",
  "call",
  "location",
  "sms",
  "add",
  "tick-circle",
  "send",
  "wallet-money",
  "briefcase",
  "book-open",
  "tree-2",
  "sun",
  "weight",
  "coffee",
  "building-4",
  "map",
  "ticket",
  "emoji-happy",
  "messages-2",
  "video",
  "health",
  "moneys",
  "teacher",
  "profile-2user",
  "search-normal",
  "location-tick",
  "calendar-tick",
  "lovely",
  "microphone-2",
  "global",
  "category-2",
  "arrow-right-03",
  "arrow-down-02",
  "clock",
  "user",
  "setting-2",
  "more",
  "flash",
  "gps",
  "emoji-normal",
  "emoji-sad",
  "close-square",
  "share",
  "menu",
];
const linearIcons = new Set(["arrow-right-01", "add", "arrow-right-03", "arrow-down-02"]);

const require = createRequire(import.meta.url);
const iconsaxDir = path.dirname(require.resolve("iconsax/manifest.json"));
const manifest = JSON.parse(
  await readFile(path.join(iconsaxDir, "manifest.json"), "utf8"),
);
const categories = new Map();
const icons = {};

for (const name of names) {
  const category = manifest[name]?.category;
  if (!category) throw new Error(`Missing Iconsax icon: ${name}`);
  if (!categories.has(category)) {
    categories.set(
      category,
      JSON.parse(
        await readFile(path.join(iconsaxDir, "data", `${category}.json`), "utf8"),
      ),
    );
  }
  const variant = linearIcons.has(name) ? "linear" : "bulk";
  const svg = categories.get(category)[name]?.[variant];
  if (!svg) throw new Error(`Missing Iconsax ${variant} icon: ${name}`);
  icons[name] = svg
    .replace(/\s+/g, " ")
    .replace(/(fill|stroke)="(?!none)[^"]*"/g, '$1="currentColor"')
    .trim();
}

await writeFile(
  "src/iconsax-icons.js",
  `// Selected Iconsax icons (MIT): navigation arrows are linear; other icons are bulk.\n` +
    `// Run npm run icons:sync after changing the icon list.\n` +
    `export const iconsaxSvg = ${JSON.stringify(icons, null, 2)};\n`,
);
