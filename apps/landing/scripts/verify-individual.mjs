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
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await openMenuIfCompact(page);
    await page.getByRole("link", { name: "Individual", exact: true }).click();
    await page.waitForURL("**/individual");
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.title(), "Wellstaq for Individuals | Join the waitlist");
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(
      await page
        .locator("#navigation")
        .getByRole("link", { name: "Pricing", exact: true })
        .count(),
      0,
      "Pricing is omitted from the individual navigation",
    );
    assert.equal(
      await page.locator(".button").evaluateAll((buttons) =>
        buttons.every((button) => getComputedStyle(button).borderRadius === "900px"),
      ),
      true,
      "CTA buttons use the shared pill radius",
    );
    assert.equal(
      await page
        .locator(".audience-switch a", { hasText: "Individual" })
        .getAttribute("aria-current"),
      "page",
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `Fits ${width}px`,
    );
    const waitlist = page.locator("#waitlist-hero");
    const email = waitlist.getByLabel("Your email address", { exact: true });
    const send = waitlist.getByRole("button", {
      name: "Join the waitlist",
      exact: true,
    });
    const draft = waitlist.locator(".waitlist-email-link");
    await send.click();
    assert.equal(await draft.isVisible(), false);
    assert.equal(await email.evaluate((e) => e.validity.valueMissing), true);
    await email.fill("not-an-email");
    await send.click();
    assert.equal(await draft.isVisible(), false);
    assert.equal(await email.evaluate((e) => e.validity.typeMismatch), true);
    await email.fill("test+individual@example.com");
    await send.click();
    assert.equal(await draft.isVisible(), true);
    assert.equal(
      await draft.evaluate((e) => e === document.activeElement),
      true,
    );
    const destination = new URL(await draft.getAttribute("href"));
    assert.equal(destination.protocol, "mailto:");
    assert.equal(destination.pathname, "hello@wellstaq.com");
    assert.equal(
      destination.searchParams.get("subject"),
      "Wellstaq for individuals: join the waitlist",
    );
    assert.match(
      destination.searchParams.get("body"),
      /test\+individual@example\.com/,
    );
    assert.match(
      await waitlist.locator(".waitlist-status").textContent(),
      /Send the email draft to join the waitlist/,
    );
    await email.fill("");
    assert.equal(
      await draft.isVisible(),
      false,
      "Changing email clears the prepared request",
    );
    await openMenuIfCompact(page);
    await page.getByRole("link", { name: "Business", exact: true }).click();
    await page.waitForURL(base + "/");
    await openMenuIfCompact(page);
    await page.getByRole("link", { name: "Individual", exact: true }).click();
    await page.waitForURL("**/individual");
    await page.waitForLoadState("load");
    if (width <= 1200) {
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      assert.equal(await page.locator("#main").evaluate((e) => e.inert), true);
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("#main").evaluate((e) => e.inert), false);
    }
    for (const item of await page.locator("[data-reveal]").all()) {
      if (await item.isVisible()) await item.scrollIntoViewIfNeeded();
    }
    await page.evaluate(() =>
      scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
    );
    await page.waitForTimeout(1500);
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    // One-time entrances (chat replay, photo arc) settle within ~5s; nothing loops.
    await page.waitForTimeout(5500);
    assert.equal(
      await page.evaluate(
        () =>
          document.getAnimations().filter((a) => a.playState === "running")
            .length,
      ),
      0,
    );
    assert.deepEqual(
      await page
        .locator("img")
        .evaluateAll((images) =>
          images.filter((img) => !img.naturalWidth).map((img) => img.src),
        ),
      [],
      `All images load at ${width}px`,
    );
    if ([1543, 768, 390, 320].includes(width)) {
      await page.screenshot({
        path: `${folder}/individual-${width}.png`,
        fullPage: true,
      });
      await page
        .locator(".ind-hero")
        .screenshot({ path: `${folder}/individual-panel-${width}.png` });
    }
    assert.deepEqual(errors, []);
    results.push({
      width,
      route: "/individual",
      form: "passed",
      navigation: "passed",
      overflow: "passed",
    });
    console.log(`Passed individual page, request and navigation ${width}px`);
    await page.close();
  }
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    await page.goto(`${base}/individual`);
    assert.equal(
      await page
        .locator("[data-reveal]")
        .evaluateAll((items) =>
          items.every((e) => getComputedStyle(e).opacity === "1"),
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
    results.push({ width, motion: "reduced", status: "passed" });
    await page.close();
  }
  writeFileSync(
    `${folder}/individual-results.json`,
    JSON.stringify(results, null, 2),
  );
  console.log(
    "Individual route, email validation, prepared requests, navigation and reduced motion passed.",
  );
} finally {
  await browser.close();
}
