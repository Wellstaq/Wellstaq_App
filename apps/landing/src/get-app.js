/* "Get the app" banner, shared by the Business and Individual pages. */
import { checkinPhone, homePhone } from "./app-phone.js";

/* Store listings. While a URL is empty its badge shows "Coming soon" and is not a link. */
const APP_STORE_URL = "";
const PLAY_STORE_URL = "";

const apple = `<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.27-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.66ZM14.1 5.86c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.27Z"/></svg>`;
const play = `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4.2 2.5 13.6 12l-9.4 9.5c-.3-.2-.5-.6-.5-1.1V3.6c0-.5.2-.9.5-1.1Z" fill="#00d7fe"/><path d="m16.8 8.8-3.2 3.2-9.4-9.5c.3-.2.8-.2 1.3.1l11.3 6.2Z" fill="#00f076"/><path d="m16.8 15.2-11.3 6.2c-.5.3-1 .3-1.3.1l9.4-9.5 3.2 3.2Z" fill="#ff3a44"/><path d="M20.3 13.1 16.8 15.2 13.6 12l3.2-3.2 3.5 1.9c.9.5.9 1.9 0 2.4Z" fill="#ffd500"/></svg>`;

const badge = (url, glyph, small, big) => {
  const inner = `${glyph}<span><small>${url ? small : "Coming soon to"}</small><b>${big}</b></span>`;
  return url
    ? `<a class="store-badge" href="${url}" target="_blank" rel="noopener">${inner}</a>`
    : `<span class="store-badge soon" aria-disabled="true">${inner}</span>`;
};

export function getAppSection({ icon, appUrl, audience = "business" }) {
  const lead =
    audience === "individual"
      ? "Events, spaces, people and support, right in your pocket."
      : "Check-ins, challenges, events and community, wherever your people are.";
  return `<section class="get-app" id="get-app" aria-labelledby="get-app-title">
    <div class="get-app-panel">
      <div class="get-app-glow" aria-hidden="true"></div>
      <div class="get-app-copy" data-reveal>
        <span class="get-app-chip">${icon("phone")}Get the app now</span>
        <h2 id="get-app-title">Wellstaq, <span>in your pocket.</span></h2>
        <p>${lead}</p>
        <div class="store-badges">
          ${badge(APP_STORE_URL, apple, "Download on the", "App Store")}
          ${badge(PLAY_STORE_URL, play, "Get it on", "Google Play")}
        </div>
        <a class="get-app-web" href="${appUrl}" target="_blank" rel="noopener"><span>Get the app</span>${audience === "individual" ? "" : icon("arrow")}<small>No App Store or Play Store needed</small></a>
      </div>
      <div class="get-app-phones" data-reveal style="--d:120ms">
        <div class="get-app-phone back">${checkinPhone()}</div>
        <div class="get-app-phone front">${homePhone()}</div>
        <span class="get-app-float f-a">${icon("activity")}<b>5-day streak</b></span>
        <span class="get-app-float f-b">${icon("check")}<b>Works in your browser</b></span>
      </div>
    </div>
  </section>`;
}
