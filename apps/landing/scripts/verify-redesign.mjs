import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const folder = "design-reference/calendly-redesign";
const base = process.env.VERIFY_URL || "http://localhost:5173";
const routes = [
  ["/", "home"],
  ["/contact", "contact"],
  ["/privacy", "privacy"],
  ["/terms", "terms"],
];
const baseline = Object.fromEntries(
  routes.map(([route, key]) => [
    route,
    JSON.parse(readFileSync(`${folder}/original-${key}.json`, "utf8")),
  ]),
);
const chats = JSON.parse(readFileSync(`${folder}/original-chats.json`, "utf8"));
mkdirSync(`${folder}/qa`, { recursive: true });
const inventory = () => {
  const normal = (s) => s.replace(/\s+/g, " ").trim();
  const content = (e) => {
    if (e.nodeType === 3) return e.textContent;
    if (e.nodeType !== 1 || e.matches("script,style,.audience-switch"))
      return "";
    if (e.hasAttribute("data-count"))
      return e.dataset.count + (e.dataset.suffix || "");
    return [...e.childNodes].map(content).join("");
  };
  return {
    sections: [
      ...document.querySelectorAll("main > section:not(#rewards)"),
    ].map((e) => ({
      id: e.id,
      text: normal(content(e)),
      headings: [...e.querySelectorAll("h1,h2,h3")].map((h) =>
        normal(h.textContent),
      ),
    })),
    header: normal(content(document.querySelector("header"))),
    footer: normal(content(document.querySelector("footer"))),
    links: [...document.querySelectorAll("a")]
      .filter((a) => !a.closest(".audience-switch,#rewards"))
      .map((a) => ({
        text: normal(a.textContent),
        href: a.getAttribute("href"),
        label: a.getAttribute("aria-label"),
      })),
    fields: [...document.querySelectorAll("input,textarea")].map((e) => ({
      name: e.name,
      placeholder: e.placeholder,
      type: e.type,
      required: e.required,
    })),
  };
};
const browser = await chromium.launch(
  process.env.PW_EXECUTABLE
    ? { executablePath: process.env.PW_EXECUTABLE, headless: true }
    : { channel: "msedge", headless: true },
);
const results = [];
try {
  for (const width of [1920, 1543, 1440, 1280, 1024, 768, 600, 390, 320]) {
    for (const [route, key] of routes) {
      const page = await browser.newPage({
        viewport: {
          width,
          height: width === 1543 ? 884 : width === 1280 ? 800 : 1000,
        },
      });
      const errors = [];
      const failures = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("response", (response) => {
        if (response.status() >= 400)
          failures.push(`${response.status()} ${response.url()}`);
      });
      await page.goto(`${base}${route}`);
      await page.evaluate(() => document.fonts.ready);
      const actual = await page.evaluate(inventory);
      const expected = baseline[route];
      assert.deepEqual(
        actual.sections,
        expected.sections.map(({ id, text, headings }) => ({
          id,
          text,
          headings,
        })),
        `Exact section copy, order and headings: ${width} ${route}`,
      );
      assert.equal(
        actual.header,
        expected.header,
        `Exact navigation copy: ${route}`,
      );
      assert.equal(
        actual.footer,
        expected.footer,
        `Exact footer copy: ${route}`,
      );
      assert.deepEqual(
        actual.links,
        expected.links,
        `Exact link labels and destinations: ${route}`,
      );
      if (expected.fields)
        assert.deepEqual(
          actual.fields,
          expected.fields,
          `Unchanged form fields: ${route}`,
        );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `No horizontal overflow: ${width} ${route}`,
      );
      assert.equal(await page.locator("h1").count(), 1);
      assert.equal(
        await page
          .locator("body")
          .textContent()
          .then((s) => /calendly/i.test(s)),
        false,
        "No reference brand/copy in the page",
      );
      await page.evaluate(async () => {
        for (const image of document.images) image.loading = "eager";
        await Promise.all(
          [...document.images].map((image) => image.decode().catch(() => {})),
        );
      });
      assert.equal(
        await page
          .locator("img")
          .evaluateAll(
            (images) => images.filter((e) => !e.naturalWidth).length,
          ),
        0,
        "All images resolve",
      );
      assert.deepEqual(
        await page
          .locator(".audience-switch > a")
          .evaluateAll((links) =>
            links.map((a) => [a.textContent, a.getAttribute("href")]),
          ),
        [
          ["Business", "/"],
          ["Individual", "/individual"],
        ],
        "Audience pills link directly to their pages",
      );
      if (width <= 1200) {
        const menu = page.getByRole("button", { name: "Menu", exact: true });
        await menu.click();
        assert.equal(
          await page.locator("#main").evaluate((e) => e.inert),
          true,
        );
        await page.locator("#navigation a").last().focus();
        await page.keyboard.press("Tab");
        assert.equal(
          await menu.evaluate((e) => e === document.activeElement),
          true,
          "Mobile navigation contains keyboard focus",
        );
        await page.keyboard.press("Escape");
        await page.locator("#navigation").waitFor({ state: "hidden" });
        assert.equal(
          await page.locator("#main").evaluate((e) => e.inert),
          false,
        );
        assert.equal(await menu.getAttribute("aria-expanded"), "false");
      }
      if (route === "/") {
        for (let i = 0; i < 4; i++) {
          await page.locator(".suite-tabs [role=tab]").nth(i).click();
          assert.equal(await page.locator(".suite-panel:visible").count(), 1);
          assert.equal(
            await page
              .locator(".suite-tabs [role=tab]")
              .nth(i)
              .getAttribute("aria-selected"),
            "true",
          );
          const panel = page.locator(".suite-panel").nth(i);
          assert.equal(await panel.isVisible(), true);
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
            `Product tab overflow: ${width} ${i}`,
          );
        }
        await page.locator(".suite-tabs [role=tab]").first().focus();
        await page.keyboard.press("End");
        assert.equal(
          await page.locator("#tab-events").getAttribute("aria-selected"),
          "true",
        );
        await page.keyboard.press("Home");
        assert.equal(
          await page.locator("#tab-checkin").getAttribute("aria-selected"),
          "true",
        );
        for (let i = 0; i < chats.length; i++) {
          await page.locator(".ai-list [role=tab]").nth(i).click();
          assert.equal(
            await page.locator(".bubble.user").textContent(),
            chats[i].question,
          );
          assert.equal(
            await page.locator(".bubble.bot").textContent(),
            chats[i].answer,
            "Every existing assistant example is unchanged",
          );
          assert.equal(
            await page
              .locator("#ai-conversation")
              .getAttribute("aria-labelledby"),
            `ai-tab-${i}`,
          );
        }
        const track = page.locator(".slider-track");
        await page
          .getByRole("button", { name: "Next story", exact: true })
          .click();
        await page.waitForFunction(
          () => document.querySelector(".slider-track").scrollLeft > 20,
        );
        await page.waitForFunction(
          () => !document.querySelector(".slider-btn.prev").disabled,
        );
        assert.equal(
          await page
            .getByRole("button", { name: "Previous story", exact: true })
            .isEnabled(),
          true,
        );
        for (const detail of await page.locator(".faq details").all()) {
          if (
            !(await detail.getAttribute("open").then((value) => value !== null))
          )
            await detail.locator("summary").click();
          assert.equal(await detail.locator("p").isVisible(), true);
        }
        if (width === 1440 || width === 1543) {
          const run = page.locator(".suite-run");
          const metrics = await run.evaluate((e) => ({
            top: e.getBoundingClientRect().top + scrollY,
            distance:
              e.offsetHeight - e.querySelector(".sticky-stage").offsetHeight,
          }));
          for (let i = 0; i < 4; i++) {
            await page.evaluate(
              ({ top, distance, index }) =>
                scrollTo({
                  top: top - 100 + distance * ((index + 0.5) / 4),
                  behavior: "instant",
                }),
              { ...metrics, index: i },
            );
            await page.waitForFunction(
              (index) =>
                document
                  .querySelectorAll(".suite-tabs [role=tab]")
                  [index].getAttribute("aria-selected") === "true",
              i,
            );
          }
          assert.equal(
            await page
              .locator(".site-header")
              .evaluate((e) => e.classList.contains("scrolled")),
            true,
          );
          // The assistant pins while its examples scroll, when the stage fits the viewport.
          const aiMetrics = await page.locator(".ai-run").evaluate((e) => ({
            pinReady: e.classList.contains("pin-ready"),
            position: getComputedStyle(e.querySelector(".sticky-stage"))
              .position,
          }));
          assert.equal(
            aiMetrics.position,
            aiMetrics.pinReady ? "sticky" : "static",
            "Assistant is sticky whenever it can be pinned",
          );
          for (let i = 0; i < 4; i++) {
            await page.locator(".ai-list [role=tab]").nth(i).click();
            assert.equal(
              await page.locator(".bubble.bot").textContent(),
              chats[i].answer,
            );
          }
          // The story carousel must reach its actual right edge before unpinning.
          const storyMetrics = await page
            .locator(".story-run")
            .evaluate((e) => ({
              top: e.getBoundingClientRect().top + scrollY,
              distance:
                e.offsetHeight - e.querySelector(".sticky-stage").offsetHeight,
              position: getComputedStyle(e.querySelector(".sticky-stage"))
                .position,
              height: e.querySelector(".sticky-stage").offsetHeight,
            }));
          assert.equal(storyMetrics.position, "sticky");
          assert.ok(
            storyMetrics.height + 100 < page.viewportSize().height,
            "Complete stories and controls fit below header",
          );
          for (const progress of [0, 0.5, 1]) {
            await page.evaluate(
              ({ top, distance, progress }) =>
                scrollTo({
                  top: top - 100 + distance * progress,
                  behavior: "instant",
                }),
              { ...storyMetrics, progress },
            );
            await page.waitForFunction((progress) => {
              const track = document.querySelector(".slider-track");
              return (
                Math.abs(
                  track.scrollLeft -
                    (track.scrollWidth - track.clientWidth) * progress,
                ) < 2
              );
            }, progress);
          }
          assert.equal(
            await page
              .getByRole("button", { name: "Next story", exact: true })
              .isEnabled(),
            false,
          );
          const lastStory = await page.locator(".story").last().boundingBox();
          const trackBox = await track.boundingBox();
          assert.ok(
            lastStory.x >= trackBox.x - 1 &&
              lastStory.x + lastStory.width <= trackBox.x + trackBox.width + 1,
            "Final story is fully readable at the end of scrolling",
          );
          const headerStyle = await page
            .locator(".site-header")
            .evaluate((e) => ({
              left: e.getBoundingClientRect().left,
              right: e.getBoundingClientRect().right,
              viewportWidth: document.documentElement.clientWidth,
              shadow: getComputedStyle(e).boxShadow,
              blur: getComputedStyle(e).backdropFilter,
            }));
          assert.equal(headerStyle.left, 0);
          assert.ok(
            Math.abs(headerStyle.right - headerStyle.viewportWidth) < 2,
          );
          assert.equal(headerStyle.shadow, "none");
          assert.equal(headerStyle.blur, "blur(20px)");
        }
      }
      assert.deepEqual(errors, [], "No runtime errors");
      assert.deepEqual(failures, [], "No failed assets");
      if ([1440, 768, 390, 320].includes(width)) {
        // Scroll naturally through every reveal before creating review artifacts.
        for (const target of await page.locator("[data-reveal]").all()) {
          if (await target.isVisible()) await target.scrollIntoViewIfNeeded();
        }
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForTimeout(700);
        await page.screenshot({
          path: `${folder}/qa/${key}-${width}.png`,
          fullPage: true,
        });
        if (route === "/" && width === 1440) {
          for (const name of [
            "hero",
            "loop",
            "why",
            "stats",
            "experience",
            "assistant",
            "privacy",
            "cta",
            "site-footer",
          ]) {
            await page.locator(`.${name}`).screenshot({
              path: `${folder}/qa/${name}-desktop.png`,
              style:
                name === "hero"
                  ? undefined
                  : ".site-header { visibility: hidden; }",
            });
          }
        }
      }
      results.push({
        route,
        width,
        copy: "exact",
        links: "exact",
        status: "passed",
      });
      console.log(`Passed ${width}px ${route}`);
      await page.close();
    }
  }
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    await page.goto(base);
    assert.equal(
      await page
        .locator(".suite-run .sticky-stage")
        .evaluate((e) => getComputedStyle(e).position),
      "static",
    );
    assert.equal(
      await page
        .locator(".ai-run .sticky-stage")
        .evaluate((e) => getComputedStyle(e).position),
      "static",
    );
    assert.equal(
      await page
        .locator(".story-run .sticky-stage")
        .evaluate((e) => getComputedStyle(e).position),
      "static",
    );
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
      "No running motion for reduced-motion users",
    );
    await page.locator(".suite-tabs [role=tab]").nth(1).click();
    assert.equal(await page.locator("#panel-challenge").isVisible(), true);
    results.push({ width, motion: "reduced", status: "passed" });
    await page.close();
  }
  writeFileSync(`${folder}/qa/results.json`, JSON.stringify(results, null, 2));
  console.log(
    `Passed ${results.length} route/breakpoint/motion checks. Original content and link destinations match exactly.`,
  );
} finally {
  await browser.close();
}
