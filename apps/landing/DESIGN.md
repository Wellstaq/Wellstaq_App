# Wellstaq marketing design

The live Wellstaq website is the content authority. The live Calendly homepage was studied on 3 October 2026 for layout, visual rhythm, navigation, product presentation and motion. No reference assets or copy are used in the site. The bundled Cal.com study was supplementary component guidance, not evidence of Calendly's current design.

## Foundations

- Keep Wellstaq's logo, orange primary action, green wellbeing accents, Funnel Display headings and Inter body text. Fonts remain locally hosted.
- A 1200px content container, 48px desktop gutters, 32px tablet gutters and 24px phone gutters establish a consistent grid.
- Use the 8/12/16/24/32/48/64/80/96px spacing scale. Section boundaries use 80px on desktop/tablet and 64px on phones. Labels before section headings have 0px top / 12px bottom margins; descriptions start 12px below the heading. Card labels have no margins or internal gaps, and descriptions hug their content.
- White, warm neutral, pale orange and dark green-grey surfaces provide a controlled sequence. Large inset panels have 40px desktop corners and 28px phone corners. UI cards use 24px corners; controls use 12px.
- Display headings use weight 500, tight tracking, balanced wrapping and fluid sizing. Body copy uses comfortable line heights and controlled widths.
- Primary CTAs are orange. Secondary CTAs are outlined. Product actions use a quiet text treatment with no underline. Links across all routes use colour/arrow feedback and visible keyboard focus.
- The header's shadow-free, translucent background spans the viewport with a 20px backdrop blur on scroll. A Business/Individual pill follows the logo: Business links directly to `/`; Individual opens `/individual`. The current audience has the dark active pill. Full navigation uses a menu at 1200px and below. At 600px and below the audience pill occupies a second header row with 44px touch targets. The audience pills have no dropdown. Escape closes mobile navigation and restores focus.

## Section inventory and composition

1. Hero: exact heading, paragraph and two CTAs; the original Wellbeing Pulse dashboard in a layered orange/green visual surface.
2. Partner proof: original six logos and original introductory sentence.
3. Platform: original introduction, Cue/Action/Reward/Insight sequence and all eight wellbeing dimensions.
4. Why Wellstaq: original introduction, streak detail and all three benefits. A new contextual photo shows a happy Nigerian team sharing an outdoor wellbeing break.
5. Wellbeing with Wellstaq: all five original values and labels, shown without temporary zero values.
6. Product suite: all four original tabs, copy, links and interface examples. On large, tall desktops, a sticky sequence progresses through the panels as the reader scrolls. Direct tab interaction stays in place. Smaller viewports use ordinary accessible tabs.
7. Employee and HR experience: all four original features and introduction, composed as a staggered two-column set on desktop and aligned columns on tablet/phone. Photos show a mobile check-in and collaboration across locations. HR insights use an anonymous chart illustration; integrations use a soft tile grid with Wellstaq in the centre and the four services already named in the original copy. Both graphics are native SVG assets. Photo prompts are documented in `design-reference/calendly-redesign/annotation-image-prompts.md` and `business-update-assets.md` in the same directory.
8. ws-AI: all four original capability descriptions and conversation examples. The stage pins on roomy desktops and progresses through all four examples while scrolling; direct mouse and keyboard selection remains available. Full answers appear immediately with a short entrance.
9. Stories: every original persona, situation and step. On roomy desktops, downward page scrolling advances the pinned carousel through the final card. Situation text and cards have natural heights. Smaller viewports use native touch scrolling and arrow controls.
10. Privacy: original statement, policy link and all four trust points.
11. FAQ: every original question and complete answer in keyboard-accessible native disclosures.
12. CTA: original heading, paragraph, Book a Demo and Get Started links.
13. Footer: every original description, group, label, contact detail and destination.

Contact and both legal routes use the same visual system while retaining their original content and behaviour. Demo/pricing prefills and the existing mailto enquiry flow remain intact.

Engagement & rewards is a single Business homepage section at `/#rewards`, placed immediately after ws-AI and before Stories. It combines the core message and rewards visual with three steps: take part, earn rewards and redeem for real cash. The former standalone page is removed; its URL redirects to the section. No payout amounts, currencies, minimums, timelines or eligibility rules are invented. Existing demo/app destinations are reused. The visual describes the concept; the section does not implement transactions.

The `/individual` waitlist page is for people who use Wellstaq without an employer. It is visual-first: each section has a short heading, at most one line of copy and a product preview. Its composition borrows patterns, not content, from three references: scattered moments that settle into a personal feed (portrait.so hero), four soft-gradient feature panels for Events, Spaces, Community and Wellbeing (portrait.so feature rows), a dark "bigger picture" stage with a glowing centre card and auto-advancing support tabs (spyglass.so), and an app-tile grid and persona carousel (acuityscheduling.com). It ends with a waitlist form above an arc of photos. Wellstaq's logo, fonts, orange/green colours, Iconsax icons and motion tokens are kept. Names, places and events in previews are illustrative and the personas are labelled as such. Interactive previews (event filters, map pins, mood check-in) are real buttons; decorative previews are hidden from assistive technology or carry an image label. The support tabs advance on their own only while visible, pause on hover and stop on any interaction or with reduced motion.

Both the Business page (after Privacy) and the Individual page carry a "Get the app" banner: App Store and Google Play badges plus an underlined "Get the app" text link to the web app, which needs no store. Store badges read "Coming soon" until their URLs are set.

## Motion and interaction

Use opacity and transforms with `cubic-bezier(.22,1,.36,1)`: 250ms feedback, 450ms panel transitions and 600ms one-time reveals. Entrances settle within roughly 700ms. There are no continuously animating decorative canvases, counters, hero galleries or flow dots.

Reduced motion disables entrances, animated feedback and scroll pinning, keeps content visible, and preserves tab/carousel functionality. A change in the preference during the session reveals pending content immediately. Mobile navigation contains keyboard focus, closes with Escape, makes the rest of the page inert while open and clears its state when resizing to desktop.

All three scroll sequences require at least 1101px width and 840px height, no reduced-motion preference, and a complete stage that fits below the header. ResizeObserver rechecks fitting after image, font or content size changes. This prevents clipped controls or forced pinning under enlarged text. Story snap points are disabled while pinned so vertical scrolling maps continuously to the full horizontal range.

## Content custody and validation

`design-reference/calendly-redesign/original-*.json` stores the original live site's section text, headings, navigation, footer, form fields and complete link destinations, including hidden product/FAQ content. `original-chats.json` stores all four original assistant examples. Text is compared after whitespace normalization; wording, punctuation, order, values and destinations must match exactly.

Run `npm run verify:redesign` with the local development server running. It checks four original routes at 1920, 1543, 1440, 1280, 1024, 768, 600, 390 and 320px; exercises tabs, assistant examples, scroll sequences, story arrows, FAQ disclosure and navigation; verifies assets, overflow and reduced motion; and saves review screenshots and results in `design-reference/calendly-redesign/qa/`. The exact original content inventory excludes the explicitly requested audience pill and new rewards section; these additions are verified separately. `npm run verify:business` checks rewards section placement at the same widths, direct audience navigation, mobile navigation, the former page redirect, assets and reduced motion.

`npm run verify:individual` checks the coming-soon route at the same nine widths, native validation, draft link destination and contents, resetting a draft when the input changes, focus, audience navigation, images and reduced motion. No email is sent during verification.
