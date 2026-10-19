import assert from "node:assert/strict";
import { test } from "node:test";
import { iconSvg } from "../src/icon.js";
import { iconsaxSvg } from "../src/iconsax-icons.js";
import { challengesWindow, clubsWindow, eventsWindow, pulseWindow } from "../src/app-window.js";
import { homePhone, checkinPhone } from "../src/app-phone.js";

test("every selected Iconsax asset preserves its glyph, sizing and accessibility", () => {
  for (const name of Object.keys(iconsaxSvg)) {
    const svg = iconSvg(name, 18);
    assert.match(svg, /width="18"/);
    assert.match(svg, /height="18"/);
    assert.match(svg, /aria-hidden="true"/);
    assert.match(svg, /focusable="false"/);
    assert.match(svg, /currentColor/);
  }
  assert.throws(() => iconSvg("unknown-icon"), /Unknown Iconsax icon/);
});

test("all product previews render with valid Iconsax selections", () => {
  for (const render of [challengesWindow, clubsWindow, eventsWindow, pulseWindow, homePhone, checkinPhone]) {
    const html = render();
    assert.match(html, /role="img"/);
    assert.doesNotMatch(html, /undefined/);
  }
});
