import { iconsaxSvg } from "./iconsax-icons.js";

/** Shared Iconsax source for the marketing site and its product previews. */
export function iconSvg(name, size = 24) {
  const svg = iconsaxSvg[name];
  if (!svg) throw new Error(`Unknown Iconsax icon: ${name}`);
  return svg.replace(/width="[^"]*"/, `width="${size}"`)
    .replace(/height="[^"]*"/, `height="${size}"`)
    .replace("<svg", '<svg aria-hidden="true" focusable="false"');
}
