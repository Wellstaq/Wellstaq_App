import "./styles.css";
import "./design-system.css";
import "./business.css";
import "./individual.css";
import "./app-phone.css";
import { checkinPhone } from "./app-phone.js";
import { challengesWindow, clubsWindow, eventsWindow, fitWindows, pulseWindow } from "./app-window.js";
import "./app-window.css";
import { iconsaxSvg } from "./iconsax-icons.js";
import { rewardsSection } from "./rewards.js";
import { individualPage, initIndividual } from "./individual.js";
import { getAppSection } from "./get-app.js";
import "./get-app.css";

const APP_URL = "https://appwellstaq6.vercel.app/";
const EMPLOYEE_APP_URL = "https://wellstaqemployee.vercel.app/";
const DEMO_URL = "/contact?interest=demo#contact-form";
const PRICING_URL = "/contact?interest=pricing#contact-form";
const path = location.pathname;
const isContact = /^\/contact(?:-us)?\/?$/.test(path);
const isPrivacy = /^\/privacy\/?$/.test(path);
const isTerms = /^\/terms\/?$/.test(path);
if (/^\/rewards\/?$/.test(path)) location.replace("/#rewards");
const isIndividual = /^\/individual\/?$/.test(path);
const isHome = !isContact && !isPrivacy && !isTerms && !isIndividual;
const home = isHome ? "" : "/";
document.body.classList.toggle("wellstaq-home", isHome);
document.body.classList.toggle("wellstaq-individual", isIndividual);
const photo = (name) => `/assets/optimized/${name}.webp`;

const icons = {
  arrow: "arrow-right-01",
  heart: "heart",
  activity: "activity",
  users: "people",
  calendar: "calendar",
  shield: "shield-tick",
  sparkles: "magic-star",
  trophy: "cup",
  bell: "notification",
  chart: "chart",
  lock: "lock",
  message: "message-text",
  phone: "call",
  pin: "location",
  mail: "sms",
  plus: "add",
  check: "tick-circle",
  send: "send",
  wallet: "wallet-money",
  work: "briefcase",
  learning: "book-open",
  environment: "tree-2",
  spirit: "sun",
  gym: "weight",
  cafe: "coffee",
  workspace: "building-4",
  map: "map",
  ticket: "ticket",
  mood: "emoji-happy",
  chat: "messages-2",
  video: "video",
  health: "health",
  money: "moneys",
  growth: "teacher",
  community: "profile-2user",
  search: "search-normal",
  nearby: "location-tick",
  booked: "calendar-tick",
  care: "lovely",
  voice: "microphone-2",
  online: "global",
};
const icon = (name, className = "icon") => {
  return iconsaxSvg[icons[name]].replace(
    "<svg",
    `<svg class="${className}" aria-hidden="true" focusable="false"`,
  );
};
const button = (label, href, style = "") =>
  `<a class="button ${style}" href="${href}">${label}${icon("arrow")}</a>`;
const eyebrow = (text) => `<p class="eyebrow">${text}</p>`;

const PHOTO_WIDTHS = [800, 1600, 2400, 3840];
const NATIVE_WIDTH = {
  app: 1586,
  connect: 1586,
  funmi: 1536,
  why: 1254,
  insights: 1586,
  kunle: 3238,
  scale: 1586,
  tobi: 1586,
};
const SECTION_PHOTOS = new Set(["why", "app", "insights", "connect", "scale"]);
/* Real photos, served at the available source widths. */
const realPhoto = (slot, alt, sizes) => {
  if (SECTION_PHOTOS.has(slot)) {
    const version = slot === "why" ? "v4" : "v2";
    return `<img src="/assets/photos/${slot}-${version}-1536.webp" srcset="/assets/photos/${slot}-${version}-800.webp 800w, /assets/photos/${slot}-${version}-1536.webp 1536w" sizes="${sizes}" alt="${alt}" loading="lazy" decoding="async" width="1536" height="${slot === "why" ? 1536 : 1024}">`;
  }
  const native = NATIVE_WIDTH[slot] || 3840;
  const srcset = PHOTO_WIDTHS.filter(
    (w, i, all) => i === 0 || all[i - 1] < native,
  )
    .map((w) => `/assets/photos/${slot}-${w}.webp ${Math.min(w, native)}w`)
    .join(", ");
  return `<img src="/assets/photos/${slot}-1600.webp" srcset="${srcset}" sizes="${sizes}" alt="${alt}" loading="lazy" decoding="async">`;
};

function header() {
  const links = isIndividual
    ? [
        ["Events", "#events"],
        ["Spaces", "#spaces"],
        ["Community", "#community"],
        ["Support", "#support"],
      ]
    : [
        ["Solutions", `${home}#solutions`],
        ["Employee & HR", `${home}#experience`],
        ["Privacy", `${home}#privacy`],
        ["FAQ", `${isContact ? "" : "/"}#faq`],
      ];
  const headerAction = isIndividual
    ? button("Join the waitlist", "#waitlist", "small")
    : button("Get Started", APP_URL, "small");
  return `<a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner"><div class="header-brand"><a class="logo" href="/" aria-label="Wellstaq home"><img src="${photo("logo")}" alt="Wellstaq" width="150" height="36"></a><div class="audience-switch" role="group" aria-label="Wellstaq for"><a href="/" ${isIndividual ? "" : 'class="active"'} ${isHome ? 'aria-current="page"' : ""}>Business</a><a href="/individual" ${isIndividual ? 'class="active" aria-current="page"' : ""}>Individual</a></div></div><button class="menu-toggle" aria-controls="navigation" aria-expanded="false"><span></span>Menu</button><nav id="navigation" aria-label="Main navigation"><div class="nav-links">${links.map(([label, href]) => `<a href="${href}">${label}</a>`).join("")}<a href="/contact" ${isContact ? 'aria-current="page"' : ""}>Contact</a></div>${headerAction}</nav></div></header>`;
}

function hero() {
  return `<section class="hero light" id="top"><div class="frame hero-frame"><div class="hero-copy"><h1>Workplace Wellbeing That Connects Every Team</h1><p class="hero-lead" data-reveal="">Wellstaq is the all-in-one wellbeing platform for remote and hybrid teams. Build healthier habits across all eight dimensions of wellbeing, and give HR privacy-first insights they can act on.</p><div class="hero-buttons" data-reveal="">${button("Request a Demo", DEMO_URL)}${button("Get Started", APP_URL, "outline")}</div></div></div><div class="frame hero-stage"><div class="dash-wrap"><div class="laptop"><div class="laptop-screen"><span class="laptop-camera" aria-hidden="true"></span><div class="dash"><img class="dash-shot" src="/assets/photos/hero-dashboard-1440.webp" alt="Wellstaq dashboard showing team staff, activity, events, clubs, overall health and employee engagement" width="1440" height="962" fetchpriority="high"></div></div></div></div></div></section>`;
}

function partners() {
  const logos = [
    ["Tricycle", 148.25, 47.244, 893.82, -31.02, -93.4, 425.48],
    ["Inventory", 190.148, 47.224, 906.19, -118.68, -99.12, 337.58],
    ["Neoniq", 170.074, 47.216, 1044.9, -298.58, -129.59, 435.13],
    ["Vertex", 161.076, 47.849, 1013.86, -39.12, -323.76, 451.76],
    ["Quonar", 163.998, 48.33, 933.32, -285.75, -290.99, 412.04],
    ["Fission", 135.088, 49.464, 706.21, -142.93, -348.97, 387.88],
  ];
  const track = logos
    .map(
      ([alt, w, h, ih, l, top, iw]) =>
        `<div class="partner-logo" style="width:${w * 0.8}px;height:${h * 0.8}px"><img src="${photo("landing-Image12")}" alt="${alt}" style="height:${ih}%;left:${l}%;top:${top}%;width:${iw}%" loading="lazy"></div>`,
    )
    .join("");
  return `<section class="partners" aria-label="Teams building with Wellstaq"><div class="frame"><p class="partners-title" data-reveal>Helping forward-thinking teams put wellbeing into practice</p><div class="marquee"><div class="marquee-track">${track}${track.replace(/alt="[^"]*"/g, 'alt=""')}</div></div></div></section>`;
}

function platform() {
  const cols = [
    [
      "Cue",
      "AI nudges, reminders and scheduled breaks meet people where they are.",
      ["AI nudges", "Reminders", "Schedules"],
    ],
    [
      "Action",
      "Check in, join a challenge, find a club or RSVP to an event in a tap.",
      ["Check-ins", "Challenges", "Clubs"],
    ],
    [
      "Reward",
      "Points, streaks, leaderboards and recognition keep the habit going.",
      ["Streaks", "Leaderboards", "Recognition"],
    ],
    [
      "Insight",
      "HR sees anonymised, aggregated trends across teams and departments.",
      ["Wellbeing Pulse", "Departments", "Reports"],
    ],
  ];
  return `<section class="section light" id="platform"><div class="frame"><div class="section-head center" data-reveal>${eyebrow("The Wellstaq platform")}<h2>Wellbeing That Connects Daily Habits To Real Impact</h2><p>Wellbeing isn't just mental or physical. It's everything. Wellstaq tracks and improves all eight dimensions in one system, built on the science of habit formation.</p></div><div class="loop" data-reveal>${cols
    .map(
      ([title, text, chips], i) =>
        `<div class="loop-col" style="--i:${i}"><h3>${title}</h3><p>${text}</p><ul>${chips.map((chip) => `<li>${chip}</li>`).join("")}</ul><span class="loop-pulse"></span></div>`,
    )
    .join(
      "",
    )}<div class="loop-rail" aria-hidden="true"><i></i></div></div>${pillars()}</div></section>`;
}

function pillars() {
  const pillarIcons = [
    "heart",
    "activity",
    "wallet",
    "work",
    "users",
    "learning",
    "environment",
    "spirit",
  ];
  const list = [
    [
      "Mental",
      "Clarity, resilience and emotional awareness through check-ins and nudges.",
    ],
    [
      "Physical",
      "Movement, energy, sleep and the everyday habits behind long-term health.",
    ],
    [
      "Financial",
      "Smarter money habits with literacy content and steady progress tracking.",
    ],
    [
      "Occupational",
      "Focus and purpose at work, with balance built into the week.",
    ],
    [
      "Social",
      "Relationships built through clubs, events and shared experiences.",
    ],
    [
      "Intellectual",
      "Growth through curated content, learning challenges and new skills.",
    ],
    [
      "Environmental",
      "Healthier surroundings and sustainable choices, at and beyond work.",
    ],
    ["Spiritual", "Space for reflection, mindfulness and personal meaning."],
  ];
  return `<div class="pillars">${list.map(([name, text], i) => `<article class="pillar" data-reveal style="--d:${(i % 4) * 70}ms">${icon(pillarIcons[i], "icon pillar-icon")}<h3>${name} Wellbeing</h3><p>${text}</p></article>`).join("")}</div>`;
}

function why() {
  const rows = [
    [
      "Personal, not one-size-fits-all",
      "A short baseline assessment and ranked priorities shape each person's journey, so everyone starts from where they actually are.",
    ],
    [
      "Nudges that turn intent into habit",
      "Cue, action, reward. Timely nudges and scheduled breaks make healthy choices the easy choice, every working day.",
    ],
    [
      "Engagement you can actually see",
      "Weekly check-ins, participation and streaks show HR what's working, without ever exposing an individual.",
    ],
  ];
  return `<section class="section light why" id="why-wellstaq"><div class="frame"><div class="section-head" data-reveal>${eyebrow("Why Wellstaq")}<h2>What Good Is A Wellbeing Benefit Nobody Uses?</h2><p>Wellstaq is designed for daily use. It blends lifestyle, productivity and community so people keep coming back, and HR gets measurable impact without compromising trust.</p></div><div class="why-grid"><div class="why-visual" data-reveal>${realPhoto("why", "Nigerian coworkers stretching together during a workplace wellbeing break", "(max-width: 1060px) 100vw, 560px")}<div class="why-blocks" aria-hidden="true"><i></i><i></i><i></i></div><div class="why-badge"><span>${icon("activity")}</span><div><strong data-count="12" data-suffix="-day streak">12-day streak</strong><small>Daily check-ins, kept up</small></div></div></div><div class="why-rows">${rows.map(([title, text], i) => `<article class="why-row" data-reveal style="--d:${i * 90}ms"><h3>${title}</h3><p>${text}</p></article>`).join("")}</div></div></div></section>`;
}

function stats() {
  const items = [
    ["8", "", "Wellbeing pillars in one system"],
    ["4", "", "Calendar and chat integrations"],
    ["0", "", "Individual records shown to HR"],
    ["24", "/7", "Access to ws-AI support"],
    ["100", "%", "Anonymised HR reporting"],
  ];
  return `<section class="stats dark"><div class="frame"><div class="stats-head" data-reveal>${eyebrow("Wellbeing with Wellstaq")}<h2>Delivering wellbeing, not just tracking it.</h2></div><div class="stats-grid">${items.map(([n, suffix, label], i) => `<div class="stat" data-reveal style="--d:${i * 80}ms"><span class="stat-num" data-count="${n}" data-suffix="${suffix}">${n}${suffix}</span><span class="stat-label">${label}</span></div>`).join("")}</div></div></section>`;
}

function suiteMock(kind) {
  if (kind === "checkin") {
    return checkinPhone();
  }
  if (kind === "challenge") {
    return challengesWindow();
  }
  if (kind === "community") {
    return clubsWindow();
  }
  return eventsWindow();
}

function suite() {
  const tabs = [
    [
      "checkin",
      "Check-ins & Scores",
      "Wellbeing check-ins",
      "Know How Your People Really Feel, Every Week",
      "Quick daily check-ins, wellbeing surveys and personal scores help each person build self-awareness and track progress over time.",
    ],
    [
      "challenge",
      "Challenges & Rewards",
      "Challenges",
      "Turn Healthy Habits Into A Team Sport",
      "Steps, running, squats or custom goals. Challenges with streaks, leaderboards and recognition make wellbeing fun and social.",
    ],
    [
      "community",
      "Clubs & Community",
      "Community",
      "Build Connection Across Every Location",
      "Clubs, posts and stories bring remote and hybrid colleagues together around shared interests, not just shared projects.",
    ],
    [
      "events",
      "Events & Spaces",
      "Events",
      "Make Room For What Matters In The Calendar",
      "Plan wellness sessions, RSVP in a tap and sync to Google Calendar or Outlook, with Zoom links generated for virtual sessions.",
    ],
  ];
  return `<section class="section light suite" id="solutions"><div class="frame"><div class="section-head" data-reveal>${eyebrow("Product suite")}<h2>One Platform For Every Side Of Wellbeing</h2></div></div><div class="sticky-run suite-run"><div class="sticky-stage"><div class="suite-tabs-band"><div class="frame"><div class="suite-tabs" role="tablist" aria-label="Wellstaq features">${tabs.map(([id, label], i) => `<button role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span>${label}</span></button>`).join("")}</div></div></div><div class="frame">${tabs
    .map(
      ([id, , kicker, title, text], i) =>
        `<div class="suite-panel${i === 0 ? " active" : ""}" role="tabpanel" id="panel-${id}" aria-labelledby="tab-${id}" ${i === 0 ? "" : "hidden"}><div class="suite-copy">${eyebrow(kicker)}<h3>${title}</h3><p>${text}</p>${button("Learn More", DEMO_URL)}</div><div class="suite-visual">${suiteMock(id)}</div></div>`,
    )
    .join("")}</div></div></div></section>`;
}

const photoAlt = {
  app: "A Nigerian employee checking in on a wellbeing app during her workday",
  insights: "HR colleagues reviewing aggregated wellbeing trends together",
  connect:
    "A Nigerian professional planning a team session with calendar and chat tools",
  scale: "Colleagues collaborating across office locations and a video call",
};
const experienceVisual = (kind) => {
  if (kind === "connect")
    return `<img src="/assets/illustrations/wellstaq-integrations.svg" alt="Wellstaq at the centre of Google Calendar, Microsoft Outlook, Slack and Zoom" width="1200" height="750" loading="lazy" decoding="async">`;
  if (kind === "insights")
    return pulseWindow();
  return realPhoto(kind, photoAlt[kind], "(max-width: 700px) 100vw, 560px");
};
function experience() {
  const cards = [
    [
      "app",
      "Employee app",
      "Wellbeing In Every Pocket",
      "An installable app with check-ins, challenges, community, events and personal scores. Private by default, and built for daily use.",
    ],
    [
      "insights",
      "HR insights",
      "See The Pulse, Never The Person",
      "Track Wellbeing Pulse, stress manageability, workload sustainability and engagement across teams, all aggregated and anonymised.",
    ],
    [
      "connect",
      "Integrations",
      "Works Where Your Team Already Works",
      "Connect Google Calendar, Microsoft Outlook, Slack and Zoom so events, reminders and challenges show up in the tools people use.",
    ],
    [
      "scale",
      "Teams & branches",
      "Scale Across Departments And Locations",
      "Organise branches, departments and roles with scoped permissions, from a single office to a distributed workforce.",
    ],
  ];
  return `<section class="section dark experience" id="experience"><div class="frame"><div class="section-head center" data-reveal>${eyebrow("Employee & HR experience")}<h2>Built For Your People, And The People Who Support Them</h2><p>Employees get a personal experience based on their needs and can track progress in real time. HR gets the clarity to act, without compromising anyone's privacy.</p>${button("Get Started", APP_URL)}</div><div class="exp-grid">${cards.map(([kind, kicker, title, text], i) => `<article class="exp-card" data-reveal style="--d:${(i % 2) * 90}ms">${eyebrow(kicker)}<h3>${title}</h3><p>${text}</p><div class="exp-photo">${experienceVisual(kind)}</div></article>`).join("")}</div></div></section>`;
}

const chats = [
  [
    "Ask in plain language",
    "No menus to dig through. Ask a wellbeing question the way you'd ask a colleague.",
    "I have back-to-back calls all day. How do I stop feeling drained?",
    "Try a five-minute reset between calls: stand up, roll your shoulders and take six slow breaths. Blocking one sync-free hour in the afternoon helps too.",
  ],
  [
    "Practical, non-diagnostic",
    "Short, practical guidance for everyday wellbeing, and a clear nudge towards professional help when it's needed.",
    "I've been sleeping badly this week.",
    "That's common in busy weeks. Keep the same wake time, dim screens 30 minutes before bed and cut caffeine after 2pm. If it carries on, speaking to a professional is a good next step.",
  ],
  [
    "Ideas for connection",
    "Suggestions that point people back to their team: clubs, events and challenges happening in Wellstaq.",
    "We're fully remote. How can I feel more connected to my team?",
    "Joining a club around a shared interest is a great start. A short virtual coffee on Fridays or a team step challenge can also build connection quickly.",
  ],
  [
    "Private by default",
    "Personal check-ins stay personal. Your organisation only ever sees anonymised trends.",
    "Can my manager see my check-ins?",
    "No. Individual check-ins aren't shared with your employer. HR only sees anonymised, aggregated insights across teams and departments.",
  ],
];
function assistant() {
  return `<section class="section dark assistant" id="ws-ai"><div class="frame"><div class="sticky-run ai-run"><div class="sticky-stage"><div class="section-head center" data-reveal>${eyebrow("ws-AI")}<h2>Ask Anything. Feel Supported. Act Sooner.</h2><p>ws-AI is Wellstaq's workplace wellness assistant. It gives concise, practical wellbeing information whenever your people need it.</p></div><div class="ai-grid" data-reveal><div class="ai-list" role="tablist" aria-label="ws-AI capabilities">${chats.map(([title, text], i) => `<button role="tab" id="ai-tab-${i}" aria-controls="ai-conversation" aria-selected="${i === 0}" data-chat="${i}" tabindex="${i === 0 ? 0 : -1}"><strong>${title}</strong><span>${text}</span></button>`).join("")}</div><div class="ai-window" id="ai-conversation" role="tabpanel" aria-labelledby="ai-tab-0" tabindex="0"><div class="ai-dash" aria-hidden="true"><div class="ai-dash-side"><b>Wellstaq</b><span class="ai-dash-org">Overview</span><ul><li class="on">Dashboard</li><li>Insights</li><li>Department</li><li>Space</li><li>Events</li></ul><small>CHALLENGES</small><ul><li>Sleep Reset</li><li>September 10K a Day</li><li>Mindful Mornings</li></ul></div><div class="ai-dash-main"><h5>Good evening, Yemi</h5><p>Here is how Yemi Inc is doing today.</p><div class="ai-dash-card"><small>Total Staff</small><b>184</b></div><div class="ai-dash-card"><small>Total Activity</small><b>2,316</b></div></div></div><div class="ai-panel"><div class="ai-top"><strong>Ask ws-AI</strong><span class="ai-top-icons" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 8.5v7M8.5 12h7"/></svg><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 6 12 12M18 6 6 18"/></svg></span></div><div class="ai-body"><p class="bubble user">${chats[0][2]}</p><p class="bubble bot">${chats[0][3]}</p></div><div class="ai-input"><span>Ask anything…</span><i>${icon("send")}</i></div><small class="ai-note">Uses AI. Verify results.</small></div></div></div></div></div></div></section>`;
}

function stories() {
  const people = [
    [
      "amara",
      "Amara",
      "New graduate",
      "Amara just started her first job, fully remote, and she's feeling lonely.",
      [
        "Joins the Trekking Lovers club and meets colleagues nearby",
        "RSVPs to a team hike, and makes real friends",
        "Her Social score climbs week by week",
      ],
    ],
    [
      "funmi",
      "Funmi",
      "Operations analyst",
      "Funmi wants to move more but never seems to find the time.",
      [
        "Signs up for the 10K Steps Week challenge",
        "Streaks and the leaderboard keep her going",
        "Movement becomes part of her day, not a chore",
      ],
    ],
    [
      "tobi",
      "Tobi",
      "New dad",
      "Tobi is running on broken sleep and it's catching up with him at work.",
      [
        "Logs sleep and energy in his daily check-in",
        "Asks ws-AI for a realistic wind-down routine",
        "Blocks a sync-free hour to recharge",
      ],
    ],
    [
      "chioma",
      "Chioma",
      "Line manager",
      "Chioma senses her team is stretched but doesn't want to pry.",
      [
        "Sees her team's anonymised Wellbeing Pulse dip",
        "Schedules a Lunch Meditation for everyone",
        "Workload trend steadies the next month",
      ],
    ],
    [
      "kunle",
      "Kunle",
      "Head of People",
      "Kunle needs to show leadership that wellbeing spend is working.",
      [
        "Tracks participation and trends in Insights",
        "Compares departments and branches, privately",
        "Brings clear, aggregated data to the budget review",
      ],
    ],
  ];
  return `<section class="section light stories" id="stories"><div class="frame"><div class="stories-head" data-reveal><div>${eyebrow("Stories")}<h2>Every Journey Looks Different. Wellstaq Meets Each One.</h2></div><p>A one-size-fits-all approach simply doesn't work. Here's how Wellstaq supports different people across your organisation.</p></div></div><div class="sticky-run story-run"><div class="sticky-stage"><div class="frame slider" data-slider><div class="slider-track" role="region" aria-label="Customer stories" tabindex="0">${people
    .map(
      ([img, name, role, situation, steps]) =>
        `<article class="story"><div class="story-photo">${realPhoto(img, `${name}, ${role.toLowerCase()}`, "(max-width: 700px) 82vw, 340px")}<span class="story-tag"><b>${name}</b>${role}</span></div><div class="story-body"><p class="story-situation">${situation}</p><div class="story-with">With Wellstaq</div><ol>${steps.map((s) => `<li>${s}</li>`).join("")}</ol></div></article>`,
    )
    .join(
      "",
    )}</div><div class="slider-controls"><div class="slider-progress"><i></i></div><button class="slider-btn prev" aria-label="Previous story">${icon("arrow")}</button><button class="slider-btn next" aria-label="Next story">${icon("arrow")}</button></div></div></div></div></section>`;
}

function privacy() {
  const points = [
    [
      "shield",
      "Aggregated by default",
      "HR and managers only see anonymised, aggregated insights across teams or departments.",
    ],
    [
      "lock",
      "Encrypted and access-controlled",
      "Industry-standard encryption in transit and at rest, with scoped roles and permissions.",
    ],
    [
      "users",
      "Individuals stay in control",
      "People can access, correct, export or delete their personal data at any time.",
    ],
    [
      "check",
      "Built for NDPR and beyond",
      "Privacy and compliance sit at the core, supporting NDPR and global data standards.",
    ],
  ];
  return `<section class="section light privacy" id="privacy"><div class="frame"><div class="privacy-grid"><div class="privacy-panel" data-reveal><div class="privacy-seal" aria-hidden="true">${icon("shield")}</div>${eyebrow("Privacy & trust")}<h2>Private By Design. Anonymous By Default.</h2><p>A person's wellbeing journey is deeply personal, even inside an organisation. Wellstaq never shares individual employee data with employers, so people can be honest and HR can still act with confidence.</p>${button("Read our privacy policy", "/privacy", "outline")}</div><div class="privacy-points">${points.map(([ic, title, text], i) => `<article data-reveal style="--d:${i * 80}ms"><span class="privacy-icon">${icon(ic)}</span><div><h3>${title}</h3><p>${text}</p></div></article>`).join("")}</div></div></div></section>`;
}

const faqs = [
  [
    "What makes Wellstaq different?",
    "Wellstaq turns wellbeing into a sustainable daily practice. Using a simple behavioural loop, it helps people build healthy habits into their routines, making the path to wellness achievable and enjoyable, across all eight dimensions of wellbeing.",
  ],
  [
    "Is employee data visible to HR or management?",
    "No individual data is shared with employers. HR teams only see anonymous, aggregated insights across departments or teams. Wellstaq is built with privacy and compliance at its core, supporting NDPR and global data standards.",
  ],
  [
    "How quickly can a company implement Wellstaq?",
    "Most organisations can onboard within hours. We offer guided setup, challenge configuration and dashboard access for HR teams. Pilot programmes can launch quickly to measure impact before a full rollout.",
  ],
  [
    "Is Wellstaq suitable for remote and hybrid teams?",
    "Yes. Wellstaq is built specifically for remote and hybrid work. From focus time to digital clubs and events, the platform supports distributed teams while fostering connection and balance.",
  ],
  [
    "How do you ensure long-term engagement?",
    "We use a behavioural framework built around Cue, Action and Reward. AI-driven nudges prompt meaningful actions, progress tracking reinforces habits, and rewards, including recognition and partner perks, sustain motivation over time.",
  ],
  [
    "Does Wellstaq replace our existing HR systems?",
    "No. Wellstaq is not a payroll or HRIS replacement. It complements your existing systems with a dedicated wellbeing and engagement layer focused on insights, habit formation, community and productivity.",
  ],
];
function faq() {
  return `<section class="section light faq" id="faq"><div class="frame"><div class="faq-grid"><div class="section-head" data-reveal>${eyebrow("FAQ")}<h2>Commonly Asked Questions</h2><p>Everything you need to know about bringing Wellstaq to your team. Can't find an answer? <a href="/contact">Talk to us</a>.</p></div><div class="faq-list">${faqs.map(([q, a], i) => `<details data-reveal style="--d:${i * 50}ms"${i === 0 ? " open" : ""}><summary><span>${q}</span>${icon("plus", "icon faq-plus")}</summary><p>${a}</p></details>`).join("")}</div></div></div></section>`;
}

function cta() {
  return `<section class="cta dark"><div class="cta-glow" aria-hidden="true"></div><div class="frame"><div class="cta-inner" data-reveal>${eyebrow("Get started")}<h2>Ready To Build A Healthier Work Culture?</h2><p>Give your team tools that balance productivity, wellbeing and community, all in one platform.</p><div class="hero-buttons">${button("Book a Demo", DEMO_URL)}${button("Get Started", APP_URL, "ghost")}</div></div></div></section>`;
}

function footer() {
  const cols = [
    [
      "Platform",
      [
        ["Overview", `${home}#platform`],
        ["Product suite", `${home}#solutions`],
        ["ws-AI", `${home}#ws-ai`],
        ["Integrations", `${home}#experience`],
      ],
    ],
    [
      "Solutions",
      [
        ["For employees", `${home}#experience`],
        ["For HR teams", `${home}#experience`],
        ["Remote & hybrid teams", `${home}#stories`],
        ["Privacy & trust", `${home}#privacy`],
      ],
    ],
    [
      "Company",
      [
        ["Contact us", "/contact"],
        ["Request a demo", DEMO_URL],
        ["Pricing", PRICING_URL],
        ["FAQ", `${isContact ? "" : "/"}#faq`],
      ],
    ],
  ];
  return `<footer class="site-footer dark"><div class="frame"><div class="footer-top"><img src="${photo("logo-light")}" alt="Wellstaq" width="150" height="36" loading="lazy"><p>Wellstaq is the wellbeing and engagement platform for remote and hybrid teams. It brings together healthy habits, community and privacy-first HR insights across all eight dimensions of wellbeing.</p></div><div class="footer-cols">${cols.map(([title, links]) => `<div><h2 class="footer-heading">${title}</h2>${links.map(([label, href]) => `<a href="${href}">${label}</a>`).join("")}</div>`).join("")}<div><h2 class="footer-heading">Contact</h2><a href="mailto:hello@wellstaq.com">${icon("mail")}hello@wellstaq.com</a><a href="tel:+2349535342">${icon("phone")}+2349 - 535 - 342</a><p>${icon("pin")}1102 South Abuja, Phonesnix vila, 123C400</p></div></div><div class="footer-bottom"><p>&copy; 2026 Wellstaq. All rights reserved.</p><div><a href="/privacy">Privacy Policy</a><a href="/terms">Terms &amp; Conditions</a></div></div></div></footer>`;
}

function contactHero() {
  const reasons = [
    [
      "calendar",
      "Book a tailored demo",
      "See Wellstaq set up around your team's size and goals.",
    ],
    [
      "chart",
      "Talk pricing",
      "Plans for pilots, growing teams and whole organisations.",
    ],
    [
      "message",
      "Ask us anything",
      "Questions about privacy, integrations or rollout.",
    ],
  ];
  return `<section class="contact-hero dark"><canvas class="mosaic" aria-hidden="true"></canvas><div class="frame contact-grid"><div class="contact-copy">${eyebrow("Contact")}<h1>Contact Us</h1><p>Improve team wellness, discover inspiring spaces, and make informed HR decisions with privacy-focused insights. Tell us about your team and we'll get back to you.</p><ul class="contact-reasons">${reasons.map(([ic, title, text]) => `<li><span>${icon(ic)}</span><div><strong>${title}</strong><small>${text}</small></div></li>`).join("")}</ul><div class="contact-direct"><a href="mailto:hello@wellstaq.com">${icon("mail")}hello@wellstaq.com</a><a href="tel:+2349535342">${icon("phone")}+2349 - 535 - 342</a></div></div><form id="contact-form" class="contact-form" novalidate><h2>Tell us about your team</h2><label for="work-email">Work email</label><input id="work-email" name="email" type="email" autocomplete="email" placeholder="you@company.com" required><label for="organization">Organization name</label><input id="organization" name="organization" autocomplete="organization" placeholder="Your organization" required><label for="message">Your message</label><textarea id="message" name="message" placeholder="How can we help?" required></textarea><button class="button" type="submit">Continue${icon("arrow")}</button><p class="form-status" role="status"></p></form></div></section>`;
}

function legalPage(title, updated, sections) {
  return `<section class="legal-hero dark"><canvas class="mosaic" aria-hidden="true"></canvas><div class="frame">${eyebrow("Legal")}<h1>${title}</h1><p>Last updated ${updated}</p></div></section><section class="section light legal"><div class="frame"><div class="legal-grid"><nav class="legal-toc" aria-label="On this page">${sections.map(([heading], i) => `<a href="#s${i}">${heading}</a>`).join("")}</nav><div class="legal-content">${sections.map(([heading, body], i) => `<article id="s${i}" data-reveal><h2>${heading}</h2>${body.map((p) => `<p>${p}</p>`).join("")}</article>`).join("")}</div></div></div></section>`;
}
function privacyPage() {
  return legalPage("Privacy Policy", "January 2026", [
    [
      "Overview",
      [
        "Wellstaq (&ldquo;Wellstaq&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) helps remote and hybrid teams track and improve wellbeing across eight dimensions: mental, physical, financial, occupational, social, intellectual, environmental, and spiritual. This policy explains what information we collect, how we use it, and the choices you have.",
      ],
    ],
    [
      "Information We Collect",
      [
        "We collect account details you provide (name, work email, organization), usage data from habit tracking, check-ins, and community features, and basic device and log information needed to keep Wellstaq secure and reliable.",
      ],
    ],
    [
      "How We Use Your Information",
      [
        "We use your information to personalize wellbeing insights, power AI-driven nudges, run challenges and community features, and help your organization understand aggregate wellbeing trends.",
      ],
    ],
    [
      "Data Sharing &amp; Employer Visibility",
      [
        "No individual employee data is shared with employers. HR and management teams only ever see anonymized, aggregated insights across departments or teams, never a single person&rsquo;s check-ins, mood logs, or habit history.",
        "We do not sell personal data. We may share data with trusted service providers who help us operate Wellstaq, under strict confidentiality obligations.",
      ],
    ],
    [
      "Data Security",
      [
        "We use industry-standard encryption in transit and at rest, access controls, and regular security reviews to protect your data. Wellstaq is built with privacy and compliance at its core, supporting NDPR and other applicable global data protection standards.",
      ],
    ],
    [
      "Your Rights",
      [
        "You may access, correct, export, or delete your personal data at any time by contacting us. Where local law grants additional rights, such as restricting or objecting to processing, we honor those requests.",
      ],
    ],
    [
      "Cookies",
      [
        "We use essential cookies to keep you signed in and remember your preferences, and limited analytics cookies to understand how Wellstaq is used so we can improve it.",
      ],
    ],
    [
      "Changes to This Policy",
      [
        "We may update this policy as Wellstaq evolves. We will post the revised version here with an updated date, and notify you of material changes.",
      ],
    ],
    [
      "Contact Us",
      [
        "Questions about this policy or your data? Email us at hello@wellstaq.com.",
      ],
    ],
  ]);
}
function termsPage() {
  return legalPage("Terms &amp; Conditions", "January 2026", [
    [
      "Acceptance of Terms",
      [
        "By accessing or using Wellstaq, you agree to be bound by these Terms &amp; Conditions. If you do not agree, please do not use the platform.",
      ],
    ],
    [
      "Description of Service",
      [
        "Wellstaq is a wellbeing and engagement platform for remote and hybrid teams, offering habit tracking, guided check-ins, community features, and anonymized dashboards for HR teams. Wellstaq is not a payroll or HRIS replacement.",
      ],
    ],
    [
      "Accounts &amp; Eligibility",
      [
        "You must provide accurate information when creating an account and are responsible for keeping your login credentials secure. You must be authorized by your organization to use Wellstaq under a company plan.",
      ],
    ],
    [
      "Acceptable Use",
      [
        "You agree not to misuse Wellstaq, including attempting to access other users&rsquo; private data, disrupting the service, or using the platform for any unlawful purpose.",
      ],
    ],
    [
      "Subscriptions &amp; Payment",
      [
        "Organizations subscribe to Wellstaq on the plan they select at signup. Fees are billed in advance and are non-refundable except where required by law. Pricing details are available on request via our contact form.",
      ],
    ],
    [
      "Intellectual Property",
      [
        "Wellstaq, its logo, and all related content and software are the property of Wellstaq and its licensors. You may not copy, modify, or redistribute any part of the platform without written permission.",
      ],
    ],
    [
      "Termination",
      [
        "We may suspend or terminate access to Wellstaq if these terms are violated. You may cancel your organization&rsquo;s subscription at any time in accordance with your agreement with us.",
      ],
    ],
    [
      "Disclaimers &amp; Limitation of Liability",
      [
        "Wellstaq is provided &ldquo;as is&rdquo; to support wellbeing, not as medical, financial, or professional advice. To the fullest extent permitted by law, Wellstaq is not liable for indirect or consequential damages arising from use of the platform.",
      ],
    ],
    [
      "Governing Law",
      [
        "These terms are governed by the laws of the jurisdiction in which Wellstaq is registered, without regard to conflict-of-law principles.",
      ],
    ],
    [
      "Changes to These Terms",
      [
        "We may revise these terms from time to time. Continued use of Wellstaq after changes take effect constitutes acceptance of the updated terms.",
      ],
    ],
    [
      "Contact Us",
      ["Questions about these terms? Email us at hello@wellstaq.com."],
    ],
  ]);
}

document.title = isPrivacy
  ? "Privacy Policy | Wellstaq"
  : isTerms
    ? "Terms & Conditions | Wellstaq"
    : isIndividual
      ? "Wellstaq for Individuals | Join the waitlist"
      : isContact
        ? "Contact Us | Wellstaq"
        : "Wellstaq | Workplace wellbeing for remote and hybrid teams";
document.querySelector("#app").innerHTML = `${header()}<main id="main">${
  isPrivacy
    ? privacyPage()
    : isTerms
      ? termsPage()
      : isIndividual
        ? individualPage({
            icon,
            getApp: getAppSection({ icon, appUrl: APP_URL, audience: "individual" }),
          })
        : isContact
          ? contactHero() + faq()
          : hero() +
            partners() +
            platform() +
            why() +
            stats() +
            suite() +
            experience() +
            assistant() +
            rewardsSection({
              button,
              eyebrow,
              icon,
              appUrl: APP_URL,
              demoUrl: DEMO_URL,
            }) +
            stories() +
            privacy() +
            getAppSection({ icon, appUrl: EMPLOYEE_APP_URL }) +
            faq()
}${isContact || isHome ? cta() : ""}</main>${footer()}`;

/* ---------- Behaviour ---------- */
fitWindows();
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = motionPreference.matches;
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const menu = $(".menu-toggle");
const nav = $("#navigation");
const setMenu = (open) => {
  menu.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
  $("#main").inert = open;
  $(".site-footer").inert = open;
};
menu.addEventListener("click", () =>
  setMenu(menu.getAttribute("aria-expanded") !== "true"),
);
nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav.classList.contains("open")) {
    setMenu(false);
    menu.focus();
  }
  if (event.key === "Tab" && nav.classList.contains("open")) {
    const stops = [menu, ...$$("a", nav)];
    const first = stops[0];
    const last = stops.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
window.matchMedia("(min-width: 1201px)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

/* Business / Individual lives in the full-screen menu on small screens. */
{
  const audience = $(".audience-switch");
  const brand = $(".header-brand");
  const compact = window.matchMedia("(max-width: 1200px)");
  const place = () => {
    if (!audience) return;
    if (compact.matches) nav.prepend(audience);
    else brand.append(audience);
  };
  compact.addEventListener("change", place);
  place();
}

const siteHeader = $(".site-header");
const onScroll = () =>
  siteHeader.classList.toggle("scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const form = $("#contact-form");
if (form) {
  const interest = new URLSearchParams(location.search).get("interest");
  if (interest === "demo")
    form.elements.message.value =
      "I would like to request a demo of Wellstaq for my team.";
  if (interest === "pricing")
    form.elements.message.value =
      "I would like to learn more about Wellstaq pricing for my organization.";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const subject = `Wellstaq enquiry: ${fields.get("organization")}`;
    const body = `Work email: ${fields.get("email")}\nOrganization: ${fields.get("organization")}\n\n${fields.get("message")}`;
    location.href = `mailto:hello@wellstaq.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    $(".form-status").textContent =
      "Your email draft is ready in your email app. Send it there to complete your enquiry, or email hello@wellstaq.com directly.";
  });
}

if (isIndividual) initIndividual({ reducedMotion: motionPreference });

/* Shared, one-time entrances. Values and copy stay readable throughout. */
const revealTargets = $$("[data-reveal]");
if (!reducedMotion && "IntersectionObserver" in window) {
  document.documentElement.classList.add("motion");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
  );
  revealTargets.forEach((el) => io.observe(el));
}
motionPreference.addEventListener("change", (event) => {
  reducedMotion = event.matches;
  if (reducedMotion) {
    document.documentElement.classList.remove("motion");
    revealTargets.forEach((el) => el.classList.add("in-view"));
  }
});

/* Accessible tabs follow the product story only on roomy desktops. */
const stickyTabsMedia = window.matchMedia(
  "(min-width: 1101px) and (min-height: 840px) and (prefers-reduced-motion: no-preference)",
);
/* Keep pinning only when the complete stage fits below the header, including
   enlarged text. Narrow, short and reduced-motion views retain direct controls. */
const stickyRuns = $$(".sticky-run");
let fitFrame = 0;
const updateStickyFit = () => {
  fitFrame = 0;
  stickyRuns.forEach((run) => {
    const stage = $(".sticky-stage", run);
    const extra = run.classList.contains("suite-run") ? 80 : 0;
    const height = run.classList.contains("ai-run")
      ? (() => {
          const styles = getComputedStyle(run);
          const pinSize = (name) => parseFloat(styles.getPropertyValue(name)) || 0;
          const head = $(".section-head", stage);
          const grid = $(".ai-grid", stage);
          return (
            pinSize("--ai-pin-top") + head.offsetHeight +
            pinSize("--ai-pin-gap") + grid.offsetHeight +
            pinSize("--ai-pin-bottom")
          );
        })()
      : stage.scrollHeight + (run.classList.contains("pin-ready") ? 0 : extra);
    run.classList.toggle(
      "pin-ready",
      stickyTabsMedia.matches && height <= innerHeight - (run.classList.contains("ai-run") ? 112 : 116),
    );
  });
};
const scheduleStickyFit = () => {
  if (!fitFrame) fitFrame = requestAnimationFrame(updateStickyFit);
};
window.addEventListener("resize", scheduleStickyFit);
stickyTabsMedia.addEventListener("change", scheduleStickyFit);
if ("ResizeObserver" in window) {
  const fitObserver = new ResizeObserver(scheduleStickyFit);
  stickyRuns.forEach((run) => fitObserver.observe($(".sticky-stage", run)));
}
updateStickyFit();
const stickyTop = (run) =>
  run
    ? parseFloat(getComputedStyle(run.querySelector(".sticky-stage")).top) || 72
    : window.innerWidth <= 1060
      ? 72
      : 120;
const isPinned = (run) =>
  run &&
  getComputedStyle(run.querySelector(".sticky-stage")).position === "sticky";
function tabs(list, onSelect, run) {
  const buttons = $$('[role="tab"]', list);
  let current = 0;
  let manualAt = null;
  let manualUntil = 0;
  const select = (index, focus = false) => {
    const next = (index + buttons.length) % buttons.length;
    if (next === current) {
      if (focus) buttons[current].focus();
      return;
    }
    current = next;
    buttons.forEach((b, i) => {
      b.setAttribute("aria-selected", String(i === current));
      b.tabIndex = i === current ? 0 : -1;
    });
    if (focus) buttons[current].focus();
    onSelect(current);
  };
  const navigate = (index, focus = false) => {
    manualAt = window.scrollY;
    manualUntil = performance.now() + 700;
    select(index, focus);
  };
  // Native focus scrolling can settle after a click. Keep that choice until it
  // settles; explicit wheel, touch or page-key scrolling resumes the sequence.
  const resumeScroll = () => {
    manualAt = null;
    manualUntil = 0;
  };
  window.addEventListener("wheel", resumeScroll, { passive: true });
  window.addEventListener("touchmove", resumeScroll, { passive: true });
  window.addEventListener("keydown", (event) => {
    if (
      !event.defaultPrevented &&
      [
        "PageDown",
        "PageUp",
        "ArrowDown",
        "ArrowUp",
        "Home",
        "End",
        " ",
      ].includes(event.key) &&
      !event.target.closest("input,textarea,select,[contenteditable=true]")
    )
      resumeScroll();
  });
  buttons.forEach((b, i) => b.addEventListener("click", () => navigate(i)));
  list.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown")
      navigate((current + 1) % buttons.length, true);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      navigate((current - 1 + buttons.length) % buttons.length, true);
    else if (e.key === "Home") navigate(0, true);
    else if (e.key === "End") navigate(buttons.length - 1, true);
    else return;
    e.preventDefault();
  });
  if (run) {
    let frame = 0;
    const sync = () => {
      frame = 0;
      if (!stickyTabsMedia.matches || !isPinned(run)) return;
      if (
        manualAt !== null &&
        (performance.now() < manualUntil ||
          Math.abs(window.scrollY - manualAt) < 32)
      )
        return;
      manualAt = null;
      const rect = run.getBoundingClientRect();
      if (rect.top > stickyTop(run) || rect.bottom < stickyTop(run)) return;
      const stage = $(".sticky-stage", run);
      const distance = Math.max(1, run.offsetHeight - stage.offsetHeight);
      const progress = Math.min(
        1,
        Math.max(0, (stickyTop(run) - rect.top) / distance),
      );
      select(
        Math.min(buttons.length - 1, Math.floor(progress * buttons.length)),
      );
    };
    const scheduleSync = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    stickyTabsMedia.addEventListener("change", scheduleSync);
    scheduleSync();
  }
}

const suiteTabs = $(".suite-tabs");
if (suiteTabs) {
  const panels = $$(".suite-panel");
  tabs(
    suiteTabs,
    (index) =>
      panels.forEach((panel, i) => {
        panel.hidden = i !== index;
        panel.classList.toggle("active", i === index);
      }),
    $(".suite-run"),
  );
}

const aiList = $(".ai-list");
if (aiList) {
  const body = $(".ai-body");
  tabs(
    aiList,
    (index) => {
      const [, , question, answer] = chats[index];
      $(".ai-window").setAttribute("aria-labelledby", `ai-tab-${index}`);
      $(".bubble.user", body).textContent = question;
      $(".bubble.bot", body).textContent = answer;
    },
    $(".ai-run"),
  );
}

/* Story slider: native touch scrolling with accessible arrow controls. */
const storyStickyMedia = stickyTabsMedia;
$$("[data-slider]").forEach((slider) => {
  const track = $(".slider-track", slider);
  const bar = $(".slider-progress i", slider);
  const run = slider.closest(".story-run");
  const step = () =>
    ($(".story", track)?.getBoundingClientRect().width || 300) +
    (parseFloat(getComputedStyle(track).columnGap) || 0);
  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    const visible = track.clientWidth / track.scrollWidth;
    $(".prev", slider).disabled = track.scrollLeft <= 1;
    $(".next", slider).disabled = track.scrollLeft >= max - 1;
    bar.style.width = `${Math.max(visible, max ? visible + (1 - visible) * (track.scrollLeft / max) : 1) * 100}%`;
  };
  const move = (direction) => {
    const max = track.scrollWidth - track.clientWidth;
    if (isPinned(run) && storyStickyMedia.matches && max > 0) {
      const stage = $(".sticky-stage", run);
      const distance = Math.max(0, run.offsetHeight - stage.offsetHeight);
      const next = Math.min(
        max,
        Math.max(0, track.scrollLeft + direction * step()),
      );
      const runTop = window.scrollY + run.getBoundingClientRect().top;
      window.scrollTo({
        top: runTop - stickyTop(run) + distance * (next / max),
        behavior: reducedMotion ? "instant" : "smooth",
      });
    } else {
      track.scrollBy({
        left: direction * step(),
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }
  };
  $(".prev", slider).addEventListener("click", () => move(-1));
  $(".next", slider).addEventListener("click", () => move(1));
  if (run) {
    let frame = 0;
    const sync = () => {
      frame = 0;
      if (!storyStickyMedia.matches || !isPinned(run)) return;
      const rect = run.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < stickyTop(run)) return;
      const stage = $(".sticky-stage", run);
      const distance = Math.max(1, run.offsetHeight - stage.offsetHeight);
      const progress = Math.min(
        1,
        Math.max(0, (stickyTop(run) - rect.top) / distance),
      );
      track.scrollLeft = progress * (track.scrollWidth - track.clientWidth);
      update();
    };
    const scheduleSync = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    storyStickyMedia.addEventListener("change", scheduleSync);
    scheduleSync();
  }
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
});

/* Hero dashboard: leans back at the top of the page and straightens as you scroll. */
{
  const wrap = $(".dash-wrap");
  if (wrap) {
    const maxTilt = () => (window.innerWidth < 760 ? 10 : 22);
    let frame = 0;
    const update = () => {
      frame = 0;
      const range = window.innerHeight * 0.55;
      const progress = reducedMotion ? 1 : Math.min(1, Math.max(0, window.scrollY / range));
      const eased = 1 - (1 - progress) ** 2;
      wrap.style.setProperty("--tilt", (maxTilt() * (1 - eased)).toFixed(2));
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    motionPreference.addEventListener("change", request);
    update();
  }
}
