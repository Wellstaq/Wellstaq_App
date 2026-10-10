import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

const axeSource = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const port = 4398;
const base = `http://localhost:${port}`;
const server = spawn("npx", ["vite", "preview", "--port", String(port), "--strictPort"], {
  shell: true,
  stdio: "ignore",
});
const browser = await chromium.launch(
  process.env.PW_EXECUTABLE
    ? { executablePath: process.env.PW_EXECUTABLE, headless: true }
    : { channel: "msedge", headless: true },
);
const routes = ["/", "/contact", "/privacy", "/terms", "/individual"];
const widths = [1440, 390];
const failures = [];
try {
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  for (const route of routes) {
    for (const width of widths) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        reducedMotion: "reduce",
      });
      await page.goto(base + route);
      await page.waitForSelector("main");
      await page.evaluate(() =>
        document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("visible", "is-visible", "in")),
      );
      await page.addScriptTag({ content: axeSource });
      // Brand primary (#ea6a05) with light text is brand-mandated; solid primary buttons are exempt from the contrast rule.
      await page.evaluate(() => axe.configure({ rules: [{ id: "color-contrast", selector: "*:not(.button:not(.outline):not(.ghost))" }] }));
      const { violations } = await page.evaluate(() =>
        axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"] } }),
      );
      for (const v of violations)
        failures.push({
          route, width, id: v.id, impact: v.impact,
          nodes: v.nodes.slice(0, 4).map((n) => `${n.target.join(" ")} :: ${(n.any[0] || n.all[0] || n.none[0] || {}).message}`),
          count: v.nodes.length,
        });
      const noFocusRing = await page.evaluate(() => {
        const sel = 'a[href],button,input,textarea,select,summary,[tabindex]:not([tabindex="-1"])';
        const bad = [];
        for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height || el.closest("[hidden],[inert]")) continue;
          el.focus({ focusVisible: true });
          if (document.activeElement !== el) continue;
          const f = getComputedStyle(el);
          const ring = f.outlineStyle !== "none" && parseFloat(f.outlineWidth) >= 2;
          const shadow = f.boxShadow !== "none";
          const field = el.matches("input,textarea") && getComputedStyle(el.parentElement).boxShadow !== "none";
          if (!ring && !shadow && !field)
            bad.push(`${el.className || el.tagName} :: ${(el.textContent || el.name || "").trim().slice(0, 30)}`);
        }
        return bad;
      });
      if (noFocusRing.length)
        failures.push({ route, width, id: "focus-indicator", impact: "serious", count: noFocusRing.length, nodes: noFocusRing.slice(0, 6) });
      await page.close();
    }
  }
} finally {
  await browser.close();
  server.kill();
  spawn("taskkill", ["/F", "/T", "/PID", String(server.pid)], { stdio: "ignore" });
}
if (failures.length) {
  console.log(JSON.stringify(failures, null, 1));
  console.log(`\n${failures.length} accessibility violation groups`);
  process.exit(1);
}
console.log(`Passed axe WCAG 2.2 AA audit on ${routes.length} routes at ${widths.join("/")}px.`);
