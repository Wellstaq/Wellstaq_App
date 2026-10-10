import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const base = process.env.VERIFY_URL || "http://localhost:5173";
const folder = "design-reference/calendly-redesign/qa";
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch(
  process.env.PW_EXECUTABLE
    ? { executablePath: process.env.PW_EXECUTABLE, headless: true }
    : { channel: "msedge", headless: true },
);
const openMenuIfCompact = async (page) => {
  const toggle = page.getByRole("button", { name: "Menu", exact: true });
  if (await toggle.isVisible()) {
    if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
  }
};
const results = [];
try {
  for (const width of [1920, 1543, 1440, 1280, 1024, 768, 600, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 884 } });
    const errors = [];
    const failures = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) failures.push(r.url());
    });
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    const business = page.locator(".audience-switch a", { hasText: "Business" });
    assert.equal(await business.getAttribute("href"), "/");
    assert.equal(
      await page.locator("#business-pages,.business-toggle").count(),
      0,
    );
    await page.goto(`${base}/individual`);
    await openMenuIfCompact(page);
    await page.getByRole("link", { name: "Business", exact: true }).click();
    await page.waitForURL(base + "/");
    assert.equal(
      await page
        .locator(".audience-switch a", { hasText: "Business" })
        .getAttribute("aria-current"),
      "page",
    );
    await page.goto(`${base}/#rewards`);
    assert.equal(
      await page.title(),
      "Wellstaq | Workplace wellbeing for remote and hybrid teams",
    );
    assert.deepEqual(
      await page.locator("main > section").evaluateAll((items) => {
        const index = items.findIndex((e) => e.id === "rewards");
        return [items[index - 1]?.id, items[index]?.id, items[index + 1]?.id];
      }),
      ["ws-ai", "rewards", "stories"],
      "Rewards immediately follows ws-AI",
    );
    assert.equal(await page.locator("#rewards h2").count(), 1);
    assert.equal(await page.locator("#rewards .reward-step").count(), 3);
    assert.equal(await page.locator("#rewards .app-phone").count(), 1);
    assert.equal(await page.locator("#rewards .reward-brand").count(), 0);
    assert.equal(await page.locator("h1").count(), 1);
    assert.match(
      await page.locator("#rewards").textContent(),
      /redeemed for real cash/,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `Rewards section fits ${width}px`,
    );
    const rewardsBottom = await page
      .locator(".rewards-hero-grid")
      .evaluate((e) => parseFloat(getComputedStyle(e).paddingBottom));
    assert.equal(
      rewardsBottom,
      width <= 600 ? 64 : width <= 1100 ? 96 : 120,
      `Rewards grid bottom spacing ${width}px`,
    );
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (const img of document.images) img.loading = "eager";
      await Promise.all(
        [...document.images].map((img) => img.decode().catch(() => {})),
      );
    });
    assert.equal(
      await page
        .locator("img")
        .evaluateAll(
          (images) => images.filter((img) => !img.naturalWidth).length,
        ),
      0,
    );
    if (width <= 1200) {
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      assert.equal(await page.locator("#main").evaluate((e) => e.inert), true);
      await page.keyboard.press("Escape");
    }
    for (const reveal of await page.locator("#rewards [data-reveal]").all())
      if (await reveal.isVisible()) await reveal.scrollIntoViewIfNeeded();
    await page.locator("#rewards").scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    if ([1543, 768, 390, 320].includes(width)) {
      await page
        .locator("#rewards")
        .screenshot({ path: `${folder}/rewards-section-${width}.png` });
      await page
        .locator(".reward-visual")
        .screenshot({ path: `${folder}/reward-visual-${width}.png` });
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(failures, []);
    results.push({
      width,
      rewards: "passed",
      navigation: "passed",
      assets: "passed",
    });
    console.log(`Passed rewards/navigation ${width}px`);
    await page.close();
  }
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 884 },
      reducedMotion: "reduce",
    });
    await page.goto(`${base}/#rewards`);
    assert.equal(
      await page
        .locator("[data-reveal]")
        .evaluateAll((elements) =>
          elements.every((e) => getComputedStyle(e).opacity === "1"),
        ),
      true,
    );
    assert.equal(
      await page.evaluate(
        () =>
          document.getAnimations().filter((a) => a.playState === "running")
            .length,
      ),
      0,
    );
    await openMenuIfCompact(page);
    await page.getByRole("link", { name: "Business", exact: true }).focus();
    assert.equal(
      await page.evaluate(
        () =>
          document.getAnimations().filter((a) => a.playState === "running")
            .length,
      ),
      0,
    );
    results.push({ width, motion: "reduced", status: "passed" });
    await page.close();
  }
  await (async () => {
    const page = await browser.newPage();
    await page.goto(`${base}/rewards`);
    await page.waitForURL("**/#rewards");
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.locator("#rewards").count(), 1);
    results.push({ legacyRoute: "/rewards", redirect: "passed" });
    await page.close();
  })();
  writeFileSync(
    `${folder}/business-results.json`,
    JSON.stringify(results, null, 2),
  );
  console.log(
    "Rewards section order, direct Business link, assets, responsive layout and reduced motion passed.",
  );
} finally {
  await browser.close();
}
