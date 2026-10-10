/* Wellstaq for individuals: the waitlist page.
   Visual first: short headings, one line of copy, and product previews that do
   the explaining. Names, places and events inside previews are illustrative. */

/* Set this to a form/waitlist endpoint (it receives POSTed JSON { email }).
   Until then, signing up prepares an email draft to the Wellstaq team. */
const WAITLIST_ENDPOINT = "";

const img = (src, alt, w, h, extra = "") =>
  `<img src="${src}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async"${extra}>`;
/* A face crop from a wider photo: x/y is the face position, z the zoom. */
const face = (src, x, y, z, loading = "lazy") =>
  `<span class="face" style="--x:${x}%;--y:${y}%;--z:${z}"><img src="${src}" alt="" width="160" height="160" loading="${loading}" decoding="async"></span>`;
const accent = (text) => `<span class="ind-accent">${text}</span>`;
const chip = (icon, glyph, label, tone = "") =>
  `<span class="ind-chip ${tone}">${icon(glyph)}${label}</span>`;

function waitlistForm(icon, id, variant = "") {
  return `<form class="waitlist-form ${variant}" id="${id}" novalidate>
    <label class="visually-hidden" for="${id}-email">Your email address</label>
    <div class="waitlist-field">
      <input id="${id}-email" name="email" type="email" autocomplete="email" placeholder="you@email.com" required>
      <button class="waitlist-submit" type="submit">Join the waitlist</button>
    </div>
    <a class="waitlist-email-link" hidden>Open email draft${icon("arrow")}</a>
    <p class="waitlist-status" role="status" aria-live="polite"></p>
  </form>`;
}

/* ---------- Hero: scattered moments that settle into your feed ---------- */
const moodFaces = (n) =>
  `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="11.5" cy="13" r="1.4" fill="currentColor"/><circle cx="20.5" cy="13" r="1.4" fill="currentColor"/><path d="${n === 0 ? "M10.5 22.5 Q16 17.5 21.5 22.5" : n === 1 ? "M11 21.5 Q16 19.5 21 21.5" : n === 2 ? "M11 20.5h10" : n === 3 ? "M11 19.5 Q16 23 21 19.5" : "M10 19 Q16 26 22 19"}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;

function feedCards(icon) {
  return [
    {
      slot: "mood",
      html: `<div class="fc fc-mood"><small>Daily check-in</small><strong>How are you feeling?</strong><div class="fc-moods">${[0, 1, 2, 3, 4].map((n) => `<span class="m${n}${n === 3 ? " on" : ""}">${moodFaces(n)}</span>`).join("")}</div><p>${icon("activity")}5-day streak</p></div>`,
    },
    {
      slot: "group",
      html: `<div class="fc fc-photo">${img("/assets/individual/community-1200.webp", "", 1200, 800)}<span class="fc-tag">${icon("community")}Meetup · Lekki</span></div>`,
    },
    {
      slot: "tall",
      html: `<div class="fc fc-photo">${img("/assets/optimized/photo-run-800.webp", "", 800, 800)}<span class="fc-tag">${icon("health")}Sunday run club</span></div>`,
    },
    {
      slot: "event",
      html: `<div class="fc fc-event"><div class="fc-date"><small>SAT</small><b>14</b></div><div><small class="tone-money">Money</small><strong>Money moves for freelancers</strong><p>${icon("pin")}Yaba, Lagos</p></div><span class="fc-rsvp">RSVP</span></div>`,
    },
    {
      slot: "space",
      html: `<div class="fc fc-photo fc-space">${img("/assets/individual/gym-buddies-nigeria.webp", "", 800, 800)}<div class="fc-space-card"><span>${icon("gym")}</span><div><strong>FitHub Studio</strong><small>Gym · 0.8 km</small></div></div></div>`,
    },
    {
      slot: "chat",
      html: `<div class="fc fc-chat"><small>${icon("chat")}Lagos remote crew</small><p class="b">Anyone co-working in Lekki tomorrow?</p><p class="b me">I'm in! Brew &amp; Work at 10?</p><div class="fc-avatars"><i style="--c:#ea6a05">T</i><i style="--c:#37b047">A</i><i style="--c:#202b35">K</i><span>+9 going</span></div></div>`,
    },
  ];
}

function hero(icon) {
  const cards = feedCards(icon);
  return `<section class="ind-hero" aria-labelledby="ind-title">
    <div class="ind-hero-glow" aria-hidden="true"></div>
    <div class="ind-hero-copy">
      <span class="ind-pill">Wellstaq for individuals</span>
      <h1 id="ind-title">Workplace perks,<br>${accent("without the workplace.")}</h1>
      <p class="ind-lead">Events, spaces, people and support for freelancers and remote workers. No company needed.</p>
      ${waitlistForm(icon, "waitlist-hero")}
      <ul class="ind-for" aria-label="Made for">
        <li>Freelancers</li><li>Remote workers</li><li>Creators</li><li>Solo founders</li>
      </ul>
    </div>
    <div class="ind-board-wrap">
      <div class="ind-board" role="img" aria-label="Preview of a personal Wellstaq feed with a mood check-in, a local meetup, a run club, a money event, a nearby gym and a remote workers' group chat">
        <div class="ind-board-head" aria-hidden="true">
          ${face("/assets/photos/chioma-800.webp", 48, 22, 2.4)}
          <div><strong>Ada Okafor</strong><small>Freelance designer · Lagos</small></div>
          <span class="ind-board-chip">${icon("nearby")}Near you this week</span>
        </div>
        <div class="ind-board-grid" aria-hidden="true">
          ${cards.map((c, i) => `<div class="ind-slot slot-${c.slot}" data-fly="${i}">${c.html}</div>`).join("")}
        </div>
        <div class="ind-toolbar" aria-hidden="true"><span>${icon("ticket")}</span><span>${icon("map")}</span><span>${icon("chat")}</span><span>${icon("mood")}</span><span>${icon("sparkles")}</span></div>
      </div>
    </div>
  </section>`;
}

/* ---------- The bigger picture (dark) ---------- */
function bigPicture(icon) {
  const events = [
    ["health", "Health", "Wellness check & yoga", "Sat · Ikeja"],
    ["money", "Money", "Taxes for freelancers", "Tue · Online"],
    ["growth", "Growth", "Pitch your work", "Thu · Yaba"],
    ["social", "Social", "Remote workers' games night", "Fri · Lekki"],
  ];
  const week = [52, 64, 48, 70, 78, 86, 82];
  return `<section class="ind-picture" aria-labelledby="picture-title">
    <div class="frame">
      <div class="ind-head center" data-reveal>
        ${chip(icon, "sparkles", "The bigger picture", "on-dark")}
        <h2 id="picture-title">Remote work ends at the laptop.<br>${accent("Wellstaq shows what's around it.")}</h2>
      </div>
      <div class="picture-stage" data-reveal role="img" aria-label="Illustration: a freelancer working outdoors, connected to events near her this week and a chart of how her week felt">
        <svg class="picture-wires" viewBox="0 0 1200 520" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="wire" x1="0" x2="1"><stop offset="0" stop-color="#ea6a05"/><stop offset=".5" stop-color="#ffc93c"/><stop offset="1" stop-color="#37b047"/></linearGradient></defs>
          <path d="M370 150 C 420 150, 400 230, 455 230"/><path d="M370 360 C 420 360, 400 300, 455 300"/>
          <path d="M830 170 C 790 170, 800 240, 745 240"/><path d="M830 380 C 790 380, 800 310, 745 310"/>
        </svg>
        <div class="picture-panel picture-events" aria-hidden="true">
          <p class="pp-title">${icon("ticket")}This week near you</p>
          ${events.map(([tone, label, title, meta]) => `<div class="pp-event"><span class="dot tone-${tone}"></span><div><strong>${title}</strong><small>${meta}</small></div><em class="tone-${tone}">${label}</em></div>`).join("")}
        </div>
        <div class="picture-center" aria-hidden="true">
          <div class="pc-head">${face("/assets/photos/chioma-800.webp", 48, 22, 2.4)}<div><strong>Ada · Working from Yaba</strong><small>Today, 11:20</small></div><span>${icon("nearby")}</span></div>
          <div class="pc-photo"><img src="/assets/photos/chioma-1600.webp" srcset="/assets/photos/chioma-800.webp 800w, /assets/photos/chioma-1600.webp 1600w" sizes="(max-width: 900px) 92vw, 420px" alt="" width="1600" height="1200" loading="lazy" decoding="async"><span class="pc-badge">${icon("community")}3 co-workers nearby</span></div>
        </div>
        <div class="picture-panel picture-week" aria-hidden="true">
          <p class="pp-title">${icon("mood")}How your week felt</p>
          <div class="pp-bars">${week.map((v, i) => `<div><i style="--v:${v}%;--d:${i * 60}ms"></i><small>${"MTWTFSS"[i]}</small></div>`).join("")}</div>
          <p class="pp-note"><b>${icon("activity")}Calmer</b> than last week</p>
          <div class="pp-split"><div><small>Check-ins</small><b>6/7</b></div><div><small>Events</small><b>2</b></div></div>
        </div>
      </div>
    </div>
  </section>`;
}

/* ---------- Four features on soft gradient panels ---------- */
function eventsMock(icon) {
  const filters = [
    ["all", "All"],
    ["health", "Health"],
    ["money", "Money"],
    ["growth", "Growth"],
    ["social", "Social"],
  ];
  const list = [
    ["health", "SAT", "14", "Wellness check & yoga", "Ikeja · 10:00"],
    ["money", "TUE", "17", "Money moves for freelancers", "Online · 18:00"],
    ["growth", "THU", "19", "Public speaking workshop", "Yaba · 17:30"],
    ["social", "FRI", "20", "Remote workers' games night", "Lekki · 19:00"],
    ["social", "SUN", "22", "Team-building hike", "Lekki · 07:00"],
    ["health", "MON", "23", "Desk stretch session", "Online · 12:30"],
  ];
  return `<div class="mock mock-events">
    <div class="mock-top"><strong>Events near you</strong><span class="live">This week</span></div>
    <div class="mock-filters" role="group" aria-label="Filter sample events">${filters.map(([id, label], i) => `<button type="button" data-filter="${id}" aria-pressed="${i === 0}">${label}</button>`).join("")}</div>
    <ul class="event-list">${list.map(([tone, d, n, title, meta]) => `<li data-tone="${tone}"><div class="ev-date tone-${tone}"><small>${d}</small><b>${n}</b></div><div><strong>${title}</strong><small>${meta}</small></div><span class="ev-rsvp" aria-hidden="true">RSVP</span></li>`).join("")}</ul>
  </div>`;
}

function spacesMock(icon) {
  const spaces = [
    ["gym", "FitHub Studio", "Gym · 0.8 km", "Open till 22:00", 26, 34],
    [
      "cafe",
      "Brew & Work Café",
      "Café · 1.2 km",
      "Fast Wi-Fi · Quiet corner",
      64,
      26,
    ],
    [
      "workspace",
      "The Hive Lekki",
      "Workspace · 2.1 km",
      "Day passes · Meeting rooms",
      70,
      62,
    ],
    ["cafe", "Garden Café", "Café · 0.5 km", "Outdoor seats", 34, 70],
  ];
  return `<div class="mock mock-spaces">
    <div class="map" aria-hidden="false">
      <svg class="map-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="300" fill="#e3f0e3"/><path d="M0 210 C 80 190, 140 240, 220 220 S 360 170, 400 190 L400 300 L0 300Z" fill="#cfe6f2"/><g fill="none" stroke="#fff" stroke-linecap="round"><path d="M-10 120 L 420 90" stroke-width="12"/><path d="M150 -10 L 190 310" stroke-width="10"/><path d="M290 -10 C 270 80, 320 150, 300 310" stroke-width="8"/><path d="M-10 40 L 160 60" stroke-width="6"/><path d="M200 160 L 410 150" stroke-width="6"/></g><g fill="#d3e8d3"><rect x="30" y="140" width="80" height="44" rx="10"/><rect x="210" y="20" width="60" height="50" rx="10"/><rect x="320" y="20" width="60" height="40" rx="10"/></g><circle cx="190" cy="140" r="34" fill="#ea6a05" opacity=".08"/><circle cx="190" cy="140" r="7" fill="#fff" stroke="#ea6a05" stroke-width="4"/></svg>
      ${spaces.map(([glyph, name, , , x, y], i) => `<button type="button" class="pin pin-${glyph}" style="left:${x}%;top:${y}%" data-space="${i}" aria-pressed="${i === 1}" aria-label="Show ${name}">${icon(glyph)}</button>`).join("")}
    </div>
    <div class="space-sheet" aria-live="polite">${spaces.map(([glyph, name, kind, detail], i) => `<div class="space-card" data-card="${i}"${i === 1 ? "" : " hidden"}><span class="sc-icon pin-${glyph}">${icon(glyph)}</span><div><strong>${name}</strong><small>${kind}</small><p>${detail}</p></div><span class="sc-go" aria-hidden="true">${icon("arrow")}</span></div>`).join("")}</div>
  </div>`;
}

function communityMock(icon) {
  const msgs = [
    ["T", "#ea6a05", "Tunde", "Anyone co-working in Lekki tomorrow?", ""],
    ["Z", "#37b047", "Zainab", "Yes! Brew & Work has the best Wi-Fi", ""],
    ["", "", "You", "Count me in. 10am?", "me"],
    ["K", "#5c5c63", "Kelechi", "Same. Then the games night on Friday?", ""],
  ];
  return `<div class="mock mock-chat">
    <div class="mock-top"><div class="chat-room"><span class="chat-room-icon">${icon("community")}</span><div><strong>Lagos remote crew</strong><small><i></i>12 online</small></div></div><span class="live">Group</span></div>
    <div class="chat-body">${msgs.map(([init, color, name, text, me], i) => `<div class="msg ${me}" style="--d:${300 + i * 500}ms">${me ? "" : `<i class="av" style="--c:${color}">${init}</i>`}<div><small>${name}</small><p>${text}</p></div></div>`).join("")}<div class="msg is-typing" style="--d:${300 + msgs.length * 500}ms"><i class="av" style="--c:#ffc93c">B</i><p><span></span><span></span><span></span></p></div></div>
    <div class="chat-input"><span>Say hello…</span><i>${icon("send")}</i></div>
  </div>`;
}

function wellbeingMock(icon) {
  const labels = ["Rough", "Low", "Okay", "Good", "Great"];
  const days = [
    ["M", 2],
    ["T", 3],
    ["W", 1],
    ["T", 3],
    ["F", 4],
    ["S", 4],
    ["S", 3],
  ];
  return `<div class="mock mock-mood">
    <div class="mock-top"><strong>Daily check-in</strong><span class="live">${icon("activity")}5-day streak</span></div>
    <p class="mood-q">How are you feeling today?</p>
    <div class="mood-row" role="group" aria-label="Try a sample check-in">${labels.map((label, n) => `<button type="button" class="mood m${n}" data-mood="${n}" aria-pressed="${n === 3}">${moodFaces(n)}<small>${label}</small></button>`).join("")}</div>
    <p class="mood-reply" aria-live="polite">Nice. Keep that going.</p>
    <div class="mood-week"><small>This week</small><div class="mood-dots">${days.map(([d, v]) => `<div><i class="m${v}" style="--h:${20 + v * 14}px"></i><small>${d}</small></div>`).join("")}</div></div>
  </div>`;
}

function features(icon) {
  const rows = [
    {
      id: "events",
      tone: "peach",
      chip: ["ticket", "Events"],
      title: `Life beyond<br>${accent("work, work, work.")}`,
      text: "Health, money, growth and meetups near you or online.",
      points: [
        "Health & fitness days",
        "Money and career talks",
        "Meetups for remote workers",
      ],
      mock: eventsMock(icon),
    },
    {
      id: "spaces",
      tone: "green",
      chip: ["map", "Spaces"],
      title: `When home gets small,<br>find your ${accent("spot.")}`,
      text: "Gyms, cafés and workspaces around you, all in one map.",
      points: ["Gyms and studios", "Work-friendly cafés", "Co-working spaces"],
      mock: spacesMock(icon),
    },
    {
      id: "community",
      tone: "sun",
      chip: ["chat", "Community"],
      title: `Gist with people<br>${accent("just like you.")}`,
      text: "Chat, swap ideas and meet fellow remote workers.",
      points: [
        "Group chats by city and interest",
        "Plan meetups together",
        "Co-workers, without the office",
      ],
      mock: communityMock(icon),
    },
    {
      id: "wellbeing",
      tone: "rose",
      chip: ["mood", "Wellbeing"],
      title: `Know how you're<br>${accent("really")} doing.`,
      text: "Quick check-ins show how you feel, week by week.",
      points: [
        "Ten-second daily check-ins",
        "Your mood, week by week",
        "Streaks that keep you going",
      ],
      mock: wellbeingMock(icon),
    },
  ];
  return `<section class="ind-features" aria-label="What you get">${rows
    .map(
      (r, i) => `<div class="feature-row${i % 2 ? " flip" : ""}" id="${r.id}">
        <div class="feature-panel tone-${r.tone}" data-reveal>${r.mock}</div>
        <div class="feature-copy" data-reveal style="--d:90ms">
          ${chip(icon, r.chip[0], r.chip[1], `tone-${r.tone}`)}
          <h2>${r.title}</h2>
          <p>${r.text}</p>
          <ul>${r.points.map((p) => `<li>${icon("check")}${p}</li>`).join("")}</ul>
        </div>
      </div>`,
    )
    .join("")}</section>`;
}

/* ---------- Support: AI coach, therapists, privacy (tabbed) ---------- */
function support(icon) {
  const tabs = [
    {
      id: "coach",
      label: "AI coach",
      title: "Talk it through, any time.",
      text: "Ask anything. Get calm, practical next steps.",
      visual: `<div class="sv-card sv-coach">
        <div class="sv-top"><span class="sv-avatar">${icon("sparkles")}</span><div><strong>Wellstaq coach</strong><small>AI · replies in seconds</small></div></div>
        <p class="bubble me">I've worked alone all week and I feel flat.</p>
        <p class="bubble">That's common when days blur together. Try one plan with people this week: a co-working morning, or an event nearby.</p>
        <div class="sv-suggest"><span>${icon("ticket")}Find an event</span><span>${icon("cafe")}Find a café</span><span>${icon("care")}Talk to someone</span></div>
        <div class="sv-input"><span>Ask your coach…</span><i>${icon("voice")}</i></div>
      </div>`,
    },
    {
      id: "therapist",
      label: "Therapists",
      title: "A real person, when you need one.",
      text: "Find a therapist and book a session that fits your week.",
      visual: `<div class="sv-card sv-therapists">
        <div class="sv-search">${icon("search")}<span>Stress and burnout</span></div>
        <div class="sv-tags"><span class="on">Stress</span><span>Burnout</span><span>Relationships</span><span>Grief</span></div>
        ${[
          [
            "NE",
            "#37b047",
            "Ngozi E.",
            "Stress · Burnout",
            "Tue 16:00",
            "video",
          ],
          [
            "DA",
            "#ea6a05",
            "David A.",
            "Anxiety · Work-life",
            "Wed 10:30",
            "video",
          ],
          ["FO", "#5c5c63", "Folake O.", "Relationships", "Thu 18:00", "pin"],
        ]
          .map(
            ([init, c, name, focus, slot, mode]) =>
              `<div class="sv-therapist"><i style="--c:${c}">${init}</i><div><strong>${name}</strong><small>${focus}</small></div><span class="sv-slot">${icon(mode)}${slot}</span><span class="sv-book">Book</span></div>`,
          )
          .join("")}
      </div>`,
    },
    {
      id: "private",
      label: "Private",
      title: "Your check-ins stay yours.",
      text: "Private by design. Export or delete your data any time.",
      visual: `<div class="sv-card sv-private">
        <span class="sv-lock">${icon("lock")}</span>
        <strong>Your wellbeing journal</strong>
        <small>Visible to: <b>only you</b></small>
        <ul>
          <li>${icon("shield")}Encrypted in transit and at rest</li>
          <li>${icon("check")}You choose what to share</li>
          <li>${icon("check")}Export or delete any time</li>
        </ul>
      </div>`,
    },
  ];
  return `<section class="ind-support" id="support" aria-labelledby="support-title">
    <div class="frame">
      <div class="ind-head center" data-reveal>
        ${chip(icon, "care", "Support, your way", "tone-rose")}
        <h2 id="support-title">Someone to talk to. ${accent("Always.")}</h2>
        <p>Start with the AI coach. Talk to a therapist when you need more.</p>
      </div>
      <div class="support-box" data-reveal>
        <div class="support-tabs" role="tablist" aria-label="Support options">${tabs.map((t, i) => `<button role="tab" type="button" id="stab-${t.id}" aria-controls="spanel-${t.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span>${t.label}</span><i aria-hidden="true"></i></button>`).join("")}</div>
        ${tabs
          .map(
            (
              t,
              i,
            ) => `<div class="support-panel" role="tabpanel" id="spanel-${t.id}" aria-labelledby="stab-${t.id}"${i === 0 ? "" : " hidden"}>
          <div class="support-copy"><h3>${t.title}</h3><p>${t.text}</p><a class="button" href="#waitlist">Join the waitlist${icon("arrow")}</a></div>
          <div class="support-visual" aria-hidden="true">${t.visual}</div>
        </div>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

/* ---------- Everything in one app ---------- */
function oneApp(icon) {
  const tiles = [
    ["ticket", "Events"],
    ["gym", "Gyms"],
    ["cafe", "Cafés"],
    ["workspace", "Workspaces"],
    ["chat", "Group chats"],
    ["money", "Money talks"],
    ["growth", "Workshops"],
    ["mood", "Check-ins"],
    ["sparkles", "AI coach"],
    ["care", "Therapists"],
    ["booked", "RSVPs"],
    ["health", "Health days"],
    ["community", "Meetups"],
    ["video", "Video sessions"],
  ];
  const tile = ([glyph, label], i) =>
    `<li style="--d:${i * 40}ms"><span class="tile">${icon(glyph)}</span><small>${label}</small></li>`;
  return `<section class="ind-oneapp" aria-labelledby="oneapp-title">
    <div class="frame">
      <div class="ind-head center" data-reveal>
        <h2 id="oneapp-title">Everything a good workplace gives you.<br>${accent("In one app.")}</h2>
      </div>
      <div class="oneapp-panel" data-reveal>
        <ul class="oneapp-grid">${tiles.slice(0, 7).map(tile).join("")}<li class="oneapp-logo"><span class="tile"><img src="/assets/optimized/logo.webp" alt="Wellstaq" width="100" height="24"></span></li>${tiles
          .slice(7)
          .map((t, i) => tile(t, i + 7))
          .join("")}</ul>
      </div>
    </div>
  </section>`;
}

/* ---------- People just like you (illustrative personas) ---------- */
function people(icon) {
  const list = [
    [
      face("/assets/photos/chioma-800.webp", 48, 22, 2.4, "eager"),
      "Ada",
      "Freelance designer",
      "work",
      "Freelancer",
      "I want people to work beside, not just faces on Zoom.",
      "peach",
    ],
    [
      face("/assets/photos/tobi-800.webp", 47, 28, 2.2, "eager"),
      "Tunde",
      "Remote developer",
      "online",
      "Remote worker",
      "My days blur together. I need reasons to step out.",
      "green",
    ],
    [
      face("/assets/optimized/photo-office-700.webp", 66, 33, 2.6, "eager"),
      "Zainab",
      "Content creator",
      "sparkles",
      "Creator",
      "I'd love events that have nothing to do with work.",
      "sun",
    ],
    [
      face("/assets/photos/why-800.webp", 62, 37, 2.2, "eager"),
      "Kelechi",
      "Solo founder",
      "workspace",
      "Founder",
      "Building alone gets heavy. Sometimes I just need to talk.",
      "rose",
    ],
    [
      face("/assets/photos/amara-800.webp", 36, 24, 2.4, "eager"),
      "Bisi",
      "Virtual assistant",
      "nearby",
      "New in town",
      "I just moved to Lagos and don't know anyone yet.",
      "sky",
    ],
  ];
  return `<section class="ind-people" aria-labelledby="people-title">
    <div class="frame">
      <div class="ind-head center" data-reveal>
        <h2 id="people-title">Made for people ${accent("just like you.")}</h2>
        <p>Different days, same need: a life that isn't only work.</p>
      </div>
    </div>
    <div class="people-carousel" data-reveal>
      <div class="people-track" role="region" aria-label="Who Wellstaq is for" tabindex="0">
        ${list
          .map(
            (
              [avatar, name, role, glyph, tag, quote, tone],
              i,
            ) => `<article class="person tone-${tone}" data-person="${i}">
          ${avatar}
          <h3>${name}</h3><p class="person-role">${role}</p>
          ${chip(icon, glyph, tag)}
          <blockquote>“${quote}”</blockquote>
        </article>`,
          )
          .join("")}
      </div>
      <div class="people-controls">
        <button type="button" class="people-btn prev" aria-label="Previous person">${icon("arrow")}</button>
        <div class="people-dots" aria-hidden="true">${list.map((_, i) => `<i${i === 0 ? ' class="on"' : ""}></i>`).join("")}</div>
        <button type="button" class="people-btn next" aria-label="Next person">${icon("arrow")}</button>
      </div>
      <p class="people-note">Illustrative personas.</p>
    </div>
  </section>`;
}

/* ---------- Final waitlist with an arc of people ---------- */
function finalCta(icon) {
  /* Small thumbnails, loaded eagerly: the outer ones sit off-screen sideways. */
  const arc = Array.from(
    { length: 11 },
    (_, i) => `/assets/individual/arc-nigeria-${String(i + 1).padStart(2, "0")}.webp`,
  );
  const mid = (arc.length - 1) / 2;
  return `<section class="ind-final" id="waitlist" aria-labelledby="final-title">
    <div class="final-floats" aria-hidden="true"><span class="f1">${icon("ticket")}</span><span class="f2">${icon("cafe")}</span><span class="f3">${icon("mood")}</span><span class="f4">${icon("chat")}</span><span class="f5">${icon("gym")}</span><span class="f6">${icon("sparkles")}</span></div>
    <div class="final-copy" data-reveal>
      <h2 id="final-title">Be first in.</h2>
      <p>Join the waitlist for Wellstaq for individuals.</p>
      ${waitlistForm(icon, "waitlist-final", "center")}
    </div>
    <div class="final-arc" aria-hidden="true" data-reveal>${arc.map((src, i) => `<div class="arc-item" style="--o:${(i - mid).toFixed(1)}"><img src="${src}" alt="" width="300" height="400" decoding="async"></div>`).join("")}</div>
  </section>`;
}

export function individualPage({ icon, getApp = "" }) {
  return `<div class="individual-page">${hero(icon)}${bigPicture(icon)}${features(icon)}${support(icon)}${oneApp(icon)}${people(icon)}${getApp}${finalCta(icon)}</div>`;
}

/* ---------- Behaviour ---------- */
export function initIndividual({ reducedMotion }) {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const calm = () => reducedMotion.matches;

  /* Waitlist: POST to the endpoint when one is set, otherwise an email draft. */
  $$(".waitlist-form").forEach((form) => {
    const input = form.elements.email;
    const link = $(".waitlist-email-link", form);
    const status = $(".waitlist-status", form);
    const reset = () => {
      link.hidden = true;
      link.removeAttribute("href");
      status.textContent = "";
      form.classList.remove("done");
    };
    input.addEventListener("input", reset);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const email = input.value.trim();
      if (WAITLIST_ENDPOINT) {
        try {
          const res = await fetch(WAITLIST_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ email, source: "individual-waitlist" }),
          });
          if (!res.ok) throw new Error(String(res.status));
          form.classList.add("done");
          status.textContent =
            "You're on the list. We'll email you when it's ready.";
          return;
        } catch {
          /* Fall through to the email draft. */
        }
      }
      const subject = "Wellstaq for individuals: join the waitlist";
      const body = `Please add me to the Wellstaq for individuals waitlist.\n\nMy email address: ${email}`;
      link.href = `mailto:hello@wellstaq.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      link.hidden = false;
      status.textContent =
        "Almost there. Send the email draft to join the waitlist.";
      link.focus();
    });
  });

  /* Hero: cards start scattered around the headline and settle into the feed as you scroll. */
  const heroEl = $(".ind-hero");
  const board = $(".ind-board");
  const slots = $$(".ind-slot");
  const scatter = [
    // x, y as fractions of the hero copy area; rotation; scale
    [0.02, 0.06, -7, 0.62],
    [0.03, 0.5, 5, 0.5],
    [0.84, 0.0, 6, 0.55],
    [-0.02, 0.8, -4, 0.82],
    [0.85, 0.6, -6, 0.56],
    [0.78, 0.86, 4, 0.82],
  ];
  const flyMedia = window.matchMedia(
    "(min-width: 1101px) and (min-height: 700px)",
  );
  let geom = null;
  let frame = 0;
  const measure = () => {
    slots.forEach((s) => (s.firstElementChild.style.transform = ""));
    if (!flyMedia.matches || calm()) {
      heroEl.classList.remove("fly");
      geom = null;
      return;
    }
    heroEl.classList.add("fly");
    const y = scrollY;
    const hero = heroEl.getBoundingClientRect();
    const boardTop = board.getBoundingClientRect().top + y;
    geom = {
      end: Math.max(1, boardTop - 96),
      items: slots.map((s, i) => {
        const r = s.getBoundingClientRect();
        const [fx, fy, rot, sc] = scatter[i];
        const tx = hero.left + fx * hero.width;
        const ty = hero.top + y + 110 + fy * (innerHeight - 260);
        return { dx: tx - r.left, dy: ty - (r.top + y), rot, sc };
      }),
    };
    update();
  };
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const update = () => {
    frame = 0;
    if (!geom) return;
    const p = ease(Math.min(1, Math.max(0, scrollY / geom.end)));
    const q = 1 - p;
    heroEl.style.setProperty("--settle", p.toFixed(3));
    slots.forEach((s, i) => {
      const g = geom.items[i];
      s.firstElementChild.style.transform = `translate(${(g.dx * q).toFixed(1)}px, ${(g.dy * q).toFixed(1)}px) rotate(${(g.rot * q).toFixed(2)}deg) scale(${(1 - (1 - g.sc) * q).toFixed(3)})`;
    });
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!frame) frame = requestAnimationFrame(update);
    },
    { passive: true },
  );
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measure, 120);
  });
  flyMedia.addEventListener("change", measure);
  reducedMotion.addEventListener("change", measure);
  if (document.readyState === "complete") measure();
  else window.addEventListener("load", measure, { once: true });
  measure();

  /* Events: sample filters */
  const eventsMockEl = $(".mock-events");
  if (eventsMockEl) {
    const buttons = $$("[data-filter]", eventsMockEl);
    buttons.forEach((b) =>
      b.addEventListener("click", () => {
        buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        const f = b.dataset.filter;
        $$(".event-list li", eventsMockEl).forEach((li) => {
          li.hidden = f !== "all" && li.dataset.tone !== f;
        });
      }),
    );
  }

  /* Spaces: map pins switch the card */
  const spacesEl = $(".mock-spaces");
  if (spacesEl) {
    const pins = $$("[data-space]", spacesEl);
    pins.forEach((pin) =>
      pin.addEventListener("click", () => {
        pins.forEach((p) => p.setAttribute("aria-pressed", String(p === pin)));
        $$("[data-card]", spacesEl).forEach(
          (c) => (c.hidden = c.dataset.card !== pin.dataset.space),
        );
      }),
    );
  }

  /* Wellbeing: sample check-in */
  const moodEl = $(".mock-mood");
  if (moodEl) {
    const replies = [
      "Sorry it's rough. Want to talk to your coach?",
      "Low days happen. A short walk can help.",
      "Okay is okay. Small steps.",
      "Nice. Keep that going.",
      "Love that. What made today great?",
    ];
    const buttons = $$("[data-mood]", moodEl);
    buttons.forEach((b) =>
      b.addEventListener("click", () => {
        buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        $(".mood-reply", moodEl).textContent = replies[+b.dataset.mood];
      }),
    );
  }

  /* Community chat plays once when it comes into view. */
  const chat = $(".mock-chat");
  if (chat) {
    if (calm() || !("IntersectionObserver" in window))
      chat.classList.add("play");
    else {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            chat.classList.add("play");
            io.disconnect();
          }
        },
        { threshold: 0.4 },
      );
      io.observe(chat);
    }
  }

  /* Support tabs: keyboard tabs that advance on their own until someone takes over. */
  const box = $(".support-box");
  if (box) {
    const tabs = $$('[role="tab"]', box);
    const panels = $$('[role="tabpanel"]', box);
    let current = 0;
    let auto = !calm();
    let timer = 0;
    let visible = false;
    const DURATION = 6000;
    const select = (i, focus = false) => {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach((t, n) => {
        const on = n === current;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        t.classList.remove("running");
      });
      panels.forEach((p, n) => (p.hidden = n !== current));
      if (focus) tabs[current].focus();
      schedule();
    };
    const schedule = () => {
      clearTimeout(timer);
      if (!auto || !visible || calm()) return;
      const t = tabs[current];
      void t.offsetWidth;
      t.classList.add("running");
      timer = setTimeout(() => select(current + 1), DURATION);
    };
    const stop = () => {
      auto = false;
      clearTimeout(timer);
      tabs.forEach((t) => t.classList.remove("running"));
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => {
        stop();
        select(i);
      });
      t.addEventListener("keydown", (e) => {
        const keys = {
          ArrowRight: 1,
          ArrowLeft: -1,
          Home: -current,
          End: tabs.length - 1 - current,
        };
        if (!(e.key in keys)) return;
        e.preventDefault();
        stop();
        select(current + keys[e.key], true);
      });
    });
    box.addEventListener("focusin", stop);
    box.addEventListener("pointerenter", () => {
      clearTimeout(timer);
      tabs[current].classList.remove("running");
    });
    box.addEventListener("pointerleave", schedule);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          visible = entries.some((e) => e.isIntersecting);
          if (visible) schedule();
          else {
            clearTimeout(timer);
            tabs[current].classList.remove("running");
          }
        },
        { threshold: 0.35 },
      ).observe(box);
    }
  }

  /* People carousel: native scrolling with arrows and a centred highlight. */
  const track = $(".people-track");
  if (track) {
    const cards = $$(".person", track);
    const dots = $$(".people-dots i");
    const nearest = () => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      cards.forEach((c, i) => {
        if (
          Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) <
          Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - mid)
        )
          best = i;
      });
      return best;
    };
    const go = (i) => {
      const c = cards[Math.max(0, Math.min(cards.length - 1, i))];
      track.scrollTo({
        left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2,
        behavior: calm() ? "auto" : "smooth",
      });
    };
    let raf = 0;
    const mark = () => {
      raf = 0;
      const n = nearest();
      cards.forEach((c, i) => c.classList.toggle("active", i === n));
      dots.forEach((d, i) => d.classList.toggle("on", i === n));
      $(".people-btn.prev").disabled = n === 0;
      $(".people-btn.next").disabled = n === cards.length - 1;
    };
    track.addEventListener(
      "scroll",
      () => {
        if (!raf) raf = requestAnimationFrame(mark);
      },
      { passive: true },
    );
    $(".people-btn.prev").addEventListener("click", () => go(nearest() - 1));
    $(".people-btn.next").addEventListener("click", () => go(nearest() + 1));
    const center = () => {
      track.scrollLeft =
        cards[1].offsetLeft - (track.clientWidth - cards[1].offsetWidth) / 2;
      mark();
    };
    window.addEventListener("load", center, { once: true });
    center();
  }
}
