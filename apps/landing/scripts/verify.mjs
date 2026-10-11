import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("design-reference/qa", { recursive: true });
const browser = await chromium.launch(
  process.env.PW_EXECUTABLE
    ? { executablePath: process.env.PW_EXECUTABLE, headless: true }
    : { channel: "msedge", headless: true },
);
const results = [];
try {
  for (const width of [1440, 768, 390, 320]) {
    for (const route of ["/", "/contact"]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`http://localhost:5173${route}`);
      await page.evaluate(async () => {
        await document.fonts.ready;
        for (const image of document.images) image.loading = "eager";
        await Promise.all(
          [...document.images].map((image) => image.decode().catch(() => {})),
        );
      });
      assert.deepEqual(errors, [], "No runtime errors");
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `Overflow at ${width} ${route}`,
      );
      assert.equal(
        await page
          .locator("img")
          .evaluateAll(
            (images) => images.filter((image) => !image.naturalWidth).length,
          ),
        0,
        "All images load",
      );
      assert.equal(await page.locator("h1").count(), 1);
      assert.equal(
        await page
          .locator("h2")
          .evaluateAll((headings) =>
            headings.some((heading) => !heading.textContent.trim()),
          ),
        false,
      );
      assert.equal(
        await page.evaluate(
          () =>
            document.fonts.check('700 52px "Funnel Display"') &&
            document.fonts.check("500 16px Inter"),
        ),
        true,
      );
      for (const href of await page
        .getByRole("link", { name: "Get Started", exact: true })
        .evaluateAll((links) => links.map((link) => link.href)))
        assert.equal(href, "https://appwellstaq.vercel.app/");
      if (width <= 768) {
        await page.getByRole("button", { name: "Menu", exact: true }).click();
        await page
          .locator("#navigation")
          .waitFor({ state: "visible", timeout: 2000 });
        await page.keyboard.press("Escape");
        await page
          .locator("#navigation")
          .waitFor({ state: "hidden", timeout: 2000 });
      }
      if (route === "/contact") {
        assert.equal(
          await page.locator("form").evaluate((form) => form.checkValidity()),
          false,
        );
        await page.getByLabel("Work email").fill("tester@example.com");
        await page.getByLabel("Organization name").fill("Test company");
        await page.getByLabel("Your message").fill("Please share a demo.");
        assert.equal(
          await page.locator("form").evaluate((form) => form.checkValidity()),
          true,
        );
        await page.locator("form").evaluate((form) => form.reset());
        await page
          .getByRole("heading", { name: "Contact Us", exact: true })
          .click();
      }
      await page.screenshot({
        path: `design-reference/qa/${route === "/" ? "landing" : "contact"}-${width}.png`,
        fullPage: true,
      });
      if (width === 1440 && route === "/") {
        for (const section of [
          ".hero",
          ".loop",
          ".suite",
          ".experience",
          ".cta",
        ])
          await page.locator(section).screenshot({
            path: `design-reference/qa/${section.slice(1)}.png`,
          });
      }
      results.push({ route, width, status: "passed" });
      await page.close();
    }
  }
  const page = await browser.newPage();
  await page.goto("http://localhost:5173/contact?interest=demo");
  assert.match(
    await page.getByLabel("Your message").inputValue(),
    /request a demo/,
  );
  await page.goto("http://localhost:5173/");
  await page
    .locator(".hero-buttons")
    .getByRole("link", { name: "Request a Demo" })
    .click();
  assert.match(page.url(), /contact\?interest=demo#contact-form/);
  console.log(JSON.stringify(results, null, 2));
  writeFileSync(
    "design-reference/qa/results.json",
    JSON.stringify(results, null, 2),
  );
} finally {
  await browser.close();
}
