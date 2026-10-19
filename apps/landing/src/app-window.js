/* Code-built product windows (Challenges dashboard, Events grid). Vector UI: sharp at any density. */
import { iconSvg } from "./icon.js";

const I = {
  search: iconSvg("search-normal", 14),
  grid: iconSvg("category-2", 14),
  pulse: iconSvg("activity", 14),
  users: iconSvg("people", 14),
  pin: iconSvg("location", 14),
  cal: iconSvg("calendar", 14),
  target: iconSvg("gps", 14),
  chevD: iconSvg("arrow-down-02", 12),
  chevR: iconSvg("arrow-right-03", 12),
  clock: iconSvg("clock", 12),
  user: iconSvg("user", 12),
  plus: iconSvg("add", 12),
  gear: iconSvg("setting-2", 14),
  more: iconSvg("more", 14),
};

const wellstaqMark = `<svg viewBox="0 0 32 28" width="22" height="19" aria-hidden="true"><path d="M3 8c0-3 2-5 6-5 5 0 7 3 7 8 0 4-2 7-6 7-5 0-7-4-7-10Z" fill="#ea6a05"/><path d="M29 8c0-3-2-5-6-5-5 0-7 3-7 8 0 4 2 7 6 7 5 0 7-4 7-10Z" fill="#37b047"/></svg>`;

const photos = {
  sunset: `<span class="aw-photo aw-sunset"></span>`,
  forest: `<span class="aw-photo aw-forest"></span>`,
  mindful: `<span class="aw-photo aw-mindful"></span>`,
  sleep: `<span class="aw-photo aw-sleep"></span>`,
  desk: `<span class="aw-photo aw-desk"></span>`,
  sun: `<span class="aw-photo aw-sun"></span>`,
  trail: `<span class="aw-photo aw-trail"></span>`,
  bridge: `<span class="aw-photo aw-bridge"><svg viewBox="0 0 120 60" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path d="M0 52h120v8H0z" fill="#2c3340"/><path d="M0 46c8-2 14-8 20-16" stroke="#c0453a" stroke-width="1.2" fill="none"/><rect x="26" y="6" width="3.4" height="50" fill="#c0453a"/><rect x="40" y="6" width="3.4" height="50" fill="#c0453a"/><path d="M26 16h17.4M26 30h17.4" stroke="#c0453a" stroke-width="2"/><path d="M0 40c10 0 20-10 28-30M43 10c20 22 40 28 77 30" stroke="#c0453a" stroke-width="1" fill="none"/></svg></span>`,
  wheel: `<span class="aw-photo aw-wheel"><svg viewBox="0 0 120 60" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><circle cx="60" cy="52" r="40" fill="none" stroke="#c9ccd0" stroke-width="5"/><circle cx="60" cy="52" r="34" fill="none" stroke="#e1e3e6" stroke-width="1.5"/><g stroke="#bfc3c8" stroke-width="1">${Array.from({ length: 18 }, (_, i) => `<path d="M60 52 L${(60 + 38 * Math.cos((i * Math.PI) / 9 - Math.PI)).toFixed(1)} ${(52 + 38 * Math.sin((i * Math.PI) / 9 - Math.PI)).toFixed(1)}"/>`).join("")}</g></svg></span>`,
};

const wrapWindow = (label, className, designW, designH, body) =>
  `<div class="aw ${className}" role="img" aria-label="${label}" data-aw-w="${designW}" data-aw-h="${designH}"><div class="aw-inner" aria-hidden="true" style="width:${designW}px;height:${designH}px">${body}</div></div>`;

const challenge = (photo, badge, badgeClass, title, desc, joined, left) =>
  `<div class="aw-card">${photo.replace("aw-photo", "aw-photo aw-tall")}<span class="aw-badge ${badgeClass}">${badge}</span><b>${title}</b><p>${desc}</p><div class="aw-meta"><span>${I.user}${joined} joined</span><span>${I.clock}${left}</span></div><div class="aw-prog"><small>Progress</small><i></i></div></div>`;

export const challengesWindow = () =>
  wrapWindow(
    "The Wellstaq Wellness Challenges dashboard showing active challenges, total participants and a grid of community challenges",
    "aw-challenges",
    720,
    500,
    `<aside class="aw-side"><div class="aw-brand">${wellstaqMark}<b>Wellstaq</b></div><div class="aw-org">Overview ${I.chevD}</div>
<nav><span>${I.grid}Dashboard</span><span>${I.pulse}Insights</span><span>${I.users}Department</span><span>${I.pin}Space</span><span>${I.cal}Events</span></nav>
<div class="aw-group"><small>CHALLENGES</small><i></i></div><nav class="aw-sub"><span>Sleep Reset</span><span>September 10K a Day</span><span>Mindful Mornings</span><span>Hydration Habit</span><span>More Challenges ${I.chevR}</span></nav>
<div class="aw-group aw-muted"><small>INTEGRATIONS</small></div><nav><span>${I.plus}Add Integration</span></nav>
<nav class="aw-foot"><span>${I.users}Team</span><span>${I.user}Pending Invites</span><span>${I.gear}Settings</span></nav></aside>
<section class="aw-main"><div class="aw-search">${I.search}Search teammates, clubs, spaces…</div>
<h4>Wellness Challenges</h4><p class="aw-sub-title">Join community challenges, track your progress, and earn rewards.</p>
<div class="aw-stats"><div><span class="aw-ico aw-ico-o">${I.target}</span><em>+50% vs last period</em><small>Active Challenges</small><b>2</b></div><div><span class="aw-ico aw-ico-b">${I.users}</span><em>+12% vs last period</em><small>Total Participants</small><b>328</b></div><div><span class="aw-ico aw-ico-g">${I.pulse}</span><em>+8%</em><small>Completion</small><b>64%</b></div></div>
<div class="aw-panel"><div class="aw-tools"><span class="aw-find">${I.search}Search challenges…</span><span class="aw-select">All challenges ${I.chevD}</span></div>
<div class="aw-grid3">${challenge(photos.sunset, "Upcoming", "aw-b-blue", "October Step Sprint", "October Step Sprint builds healthy habits together with the finest team.", 48, "11 days left")}${challenge(photos.forest, "Upcoming", "aw-b-blue", "Hydration Habit", "Hydration Habit builds healthy habits together with the whole team.", 31, "11 days left")}${challenge(photos.mindful, "Upcoming", "aw-b-blue", "Mindful Mornings", "Mindful Mornings builds healthy habits together with the whole team.", 67, "46 days left")}${challenge(photos.sleep, "Active", "aw-b-green", "Sleep Reset", "Sleep Reset builds restful routines together with your team.", 42, "9 days left")}${challenge(photos.desk, "Active", "aw-b-green", "Desk Stretch Breaks", "Short stretch breaks that keep the whole team moving.", 25, "6 days left")}</div></div></section>`,
  );

const eventCard = (photo, title, date, where, going) =>
  `<div class="aw-card aw-ev">${photo}<b>${title}</b><span class="aw-line">${I.cal}${date}</span><span class="aw-line">${I.pin}${where}</span><div class="aw-ev-foot"><span>${I.users}${going} participants</span>${I.more}</div></div>`;

export const eventsWindow = () =>
  wrapWindow(
    "A grid of upcoming Wellstaq wellness events with dates, locations and participant counts",
    "aw-events",
    520,
    420,
    `<section class="aw-main aw-solo"><div class="aw-panel"><div class="aw-tools"><span class="aw-find aw-wide">${I.search}Search events…</span></div>
<div class="aw-grid3 aw-grid2">${eventCard(photos.sun, "Sunrise Yoga in the Park", "Oct 12, 2026", "Virtual", 24)}${eventCard(photos.trail, "Mindful Wellness Workshop", "Oct 14, 2026", "Lagos office", 36)}${eventCard(photos.bridge, "Weekly Cycling Tour", "Oct 16, 2026", "All branches", 19)}${eventCard(photos.wheel, "Quarterly Wellbeing Town Hall", "Oct 21, 2026", "Virtual", 118)}</div></div></section>`,
  );

const heart = iconSvg("heart", 13);
const comment = iconSvg("message-text", 13);
const share = iconSvg("share", 13);
const send = iconSvg("send", 12);
const bell = iconSvg("notification", 16);

const clubCard = (photoClass, name, tag, blurb, members) =>
  `<div class="aw-club"><div class="aw-club-top"><span class="aw-club-photo ${photoClass}"></span><div><b>${name}</b><span class="aw-tag">${tag}</span></div><span class="aw-plus">${I.plus}</span></div><p>${blurb}</p><small>${I.users}${members} members</small></div>`;

const actions = `<div class="aw-actions"><span>${heart}Like</span><span>${comment}Comment</span><span>${share}Share</span></div>`;

export const clubsWindow = () =>
  wrapWindow(
    "The Wellstaq Clubs and Feed screen, showing community clubs to join and a feed of posts from colleagues",
    "aw-clubs",
    640,
    470,
    `<section class="aw-clubs-col"><div class="aw-search aw-clubs-search">${I.search}Search clubs<span class="aw-kbd">⌘</span><span class="aw-kbd">K</span></div>
<h4>Clubs</h4><p class="aw-sub-title">Join communities that match your goals</p>
<div class="aw-tabs2"><span class="on">Other Clubs</span><span>My Clubs</span></div>
${clubCard("aw-cp1", "Five-a-side Football", "Team Bonding", "Five-a-side Football — a Yemi Inc community club.", 26)}${clubCard("aw-cp2", "Meal Prep Crew", "Nutrition", "Meal Prep Crew — a Yemi Inc community club.", 14)}</section>
<section class="aw-feed"><div class="aw-feed-head"><b>Feed</b><span>Everyone ${I.chevD}</span></div>
<div class="aw-post"><span class="aw-feed-photo"></span><div class="aw-likes"><span><i class="aw-hearts">${heart}</i>37 likes</span><span>7 comments &nbsp; 3 shares</span></div>${actions}<div class="aw-write"><span class="aw-me"></span><span class="aw-input">Write a comment…<em>${send}</em></span></div></div>
<div class="aw-post"><div class="aw-author"><span class="aw-face"></span><div><b>Kunle Ojo</b><small>General · 11 hrs ago</small></div></div><p class="aw-body">Our pulse check shows workload is the top concern this month. Managers, please check in with your teams <i>#Wellbeing</i></p><div class="aw-likes"><span><i class="aw-hearts">${heart}</i>32 likes</span><span>6 comments &nbsp; 3 shares</span></div>${actions}</div></section>`,
  );

const pulseRow = (name, state, pct, tone) =>
  `<div class="aw-pr"><b>${name}</b><div class="aw-pr-meta"><span>${state}</span><strong>${pct}%</strong></div><div class="aw-pr-bar"><i class="${tone}" style="width:${pct}%"></i></div></div>`;

export const pulseWindow = () =>
  wrapWindow(
    "Wellbeing Pulse card showing aggregated indicators and a wellbeing distribution chart: 57% doing well, 29% needing attention and 14% needing priority support",
    "aw-pulse",
    544,
    340,
    `<div class="aw-pcard aw-pcard-a"><h5>Wellbeing Pulse</h5><div class="aw-ticks"></div>
<div class="aw-legend3"><span><i class="aw-d-red"></i>14% Priority support</span><span><i class="aw-d-amber"></i>29% Needs attention</span><span><i class="aw-d-green"></i>57% Doing well</span></div>
<div class="aw-plist">${pulseRow("Stress Manageability", "Needs attention", 48, "amber")}${pulseRow("Energy & Recovery", "Doing well", 71, "green")}${pulseRow("Connection & Belonging", "Doing well", 78, "green")}${pulseRow("Workload Sustainability", "Priority focus", 34, "red")}${pulseRow("Workplace Comfort", "Doing well", 82, "green")}</div></div>
<div class="aw-pcard aw-pcard-b"><h5>Wellbeing Distribution</h5><div class="aw-donut"></div>
<ul class="aw-dl"><li><i class="aw-d-green"></i>Doing well<b>57%</b></li><li><i class="aw-d-amber"></i>Needs attention<b>29%</b></li><li><i class="aw-d-red"></i>Priority focus<b>14%</b></li></ul></div>`,
  );

/* Scale each window to its container, keeping the type crisp (no bitmap resampling). */
export function fitWindows(root = document) {
  const wins = [...root.querySelectorAll(".aw")];
  if (!wins.length) return;
  const apply = (win) => {
    const w = +win.dataset.awW;
    const h = +win.dataset.awH;
    const avail = win.parentElement ? win.parentElement.clientWidth : w;
    const pad = parseFloat(getComputedStyle(win.parentElement).paddingLeft) || 0;
    const target = Math.max(200, avail - pad - (win.classList.contains("aw-events") ? pad : 0));
    const scale = win.classList.contains("aw-pulse")
      ? avail / w
      : Math.min(1, target / w);
    win.style.setProperty("--aw-scale", scale.toFixed(4));
    win.style.height = `${Math.round(h * scale)}px`;
  };
  const ro = "ResizeObserver" in window ? new ResizeObserver((entries) => entries.forEach((e) => { const win = e.target.querySelector(".aw"); if (win) apply(win); })) : null;
  wins.forEach((win) => {
    apply(win);
    if (ro && win.parentElement) ro.observe(win.parentElement);
  });
  window.addEventListener("resize", () => wins.forEach(apply));
}
