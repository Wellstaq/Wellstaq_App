# Wellstaq website

Responsive landing, individual coming-soon, contact, privacy and terms pages. The visual system takes its layout, spacing, product presentation and interaction direction from a study of the current Calendly website, while retaining Wellstaq's live-site content, logo, fonts, orange identity and existing functionality. The Engagement & rewards section immediately after ws-AI adds messaging about earning rewards through engagement and redeeming for real cash. See `DESIGN.md` for the shared system and section inventory.

## Run

```sh
npm install
npm run dev
```

Open the local URL shown by Vite. The contact page is `/contact`; the Business pill links directly to `/`. The Individual pill opens the coming-soon page at `/individual`.

```sh
npm run build
npm run preview
```

The production output is `dist/`. For a static host, serve the marketing routes using `index.html`; a Vercel rewrite configuration covers the contact, legal and individual pages. The former `/rewards` URL redirects to `/#rewards`.

## Design and implementation

- Plain JavaScript with shared rendering functions and CSS; Vite handles development and production builds.
- Original Figma exports are saved in `public/assets/`. Smaller lossless WebP copies are served where they reduce file size; the original pixels are preserved. Fonts are self-hosted in `public/fonts/`.
- Shared page markup, original copy and behaviour live in `src/main.js`. `src/rewards.js` renders the homepage rewards section, with its styles in `src/business.css`. `src/design-system.css` defines the shared marketing design over the existing base styles in `src/styles.css`. `src/assets.json` and `src/copy.json` are historic Figma exports, retained for asset tooling; the live-site inventories in `design-reference/calendly-redesign/` are the redesign's content authority.
- Motion: short hero entrances, one-time scroll reveals, restrained hover feedback, product panel transitions, and product/assistant/story scroll sequences on roomy desktop viewports. Native touch scrolling and direct keyboard controls serve smaller viewports; reduced motion disables pinning. Complete stages must fit below the header before pinning is enabled.
- Shared section padding is 80px on desktop/tablet and 64px on phones. The full-width, shadow-free header has a 20px scroll-state blur and a Business/Individual audience pill. Business links directly to the homepage. Individual opens its requested coming-soon page. On phones the pill uses a second header row.
- `src/individual.js` and `src/individual.css` build the `/individual` waitlist page for people who use Wellstaq without an employer: events near you, local spaces (gyms, cafés, workspaces), community chat, wellbeing check-ins, an AI coach and therapists. It is visual-first with short copy. The hero cards start scattered and settle into a personal feed as you scroll (roomy desktops only; static elsewhere and with reduced motion). Names, places and events inside the previews are illustrative. Compressed photos for the page live in `public/assets/individual/` (`node scripts/individual-images.mjs` regenerates them).
- Waitlist forms POST `{ email }` to `WAITLIST_ENDPOINT` in `src/individual.js` when it is set. Until then they validate the email and prepare an email draft to `hello@wellstaq.com`; nothing is stored by this project.
- `src/get-app.js` and `src/get-app.css` render the "Get the app" banner on both pages. Set `APP_STORE_URL` and `PLAY_STORE_URL` in `src/get-app.js` when the store listings exist; until then the badges read "Coming soon". The "Get the app" text link opens the web app, which needs no store.
- Section photography has responsive 800px/1536px WebP variants. Why Wellstaq now shows a happy team. HR insights and integrations use native SVG illustrations, with Wellstaq at the centre of the integration grid. The built-in image generation prompts and source paths are recorded in `design-reference/calendly-redesign/annotation-image-prompts.md` and `business-update-assets.md` in the same directory.
- `design-reference/` holds source design context and visual QA screenshots, and is excluded from the production output.
- Desktop dimensions follow the 1440px Figma frames; responsive layouts adapt to tablet and phone screens.
- Business Get Started links lead to `https://appwellstaq.vercel.app/`. Individual web-app links lead to `https://wellstaqemployee.vercel.app/`.
- Demo and pricing links open the contact page with a relevant message prefilled.
- The contact form validates email, organization, and message, then opens an email draft to `hello@wellstaq.com`. Delivery occurs only after the visitor sends that email. No form backend was supplied.
- Existing privacy and terms pages and every original link destination are retained.

## Verification

With the dev server running on port 5173:

```sh
node scripts/verify.mjs
```

Uses Playwright with installed Microsoft Edge (or the Chromium binary at `PW_EXECUTABLE`) to verify both routes at desktop, tablet, and mobile widths, asset/font loading, overflow, navigation, form validation, and app destinations. Screenshots and results go to `design-reference/qa/`.

```sh
npm run verify:redesign
```

Compares all four routes with the original live site's copy and link inventories at nine viewport widths, including the 1543×884 annotation viewport. The requested audience links are checked separately. Also checks every product tab and assistant example, scroll-driven progress through the assistant and final story, carousel controls, FAQ disclosures, mobile keyboard navigation and reduced motion. Review screenshots and results are saved separately under `design-reference/calendly-redesign/qa/`. Set `VERIFY_URL` to check a production preview instead of the development server.

```sh
npm run verify:business
```

Checks the rewards section and direct Business pill at nine widths, including placement after ws-AI and before Stories, navigation between audiences, mobile navigation, the former page redirect, images, overflow and reduced motion. It saves screenshots and `business-results.json` alongside the other redesign checks.

```sh
npm run verify:individual
```

Checks the coming-soon route at nine widths, audience navigation, email validation and draft contents, focus, assets, overflow and reduced motion. The check prepares the draft link without opening an email app or sending anything.
