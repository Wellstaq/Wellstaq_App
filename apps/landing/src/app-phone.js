/* Crisp, code-built phone screens: vector UI that stays sharp at any pixel density. */
const statusBar = `<div class="ap-status"><span class="ap-time">9:41</span><span class="ap-island"></span><span class="ap-sys"><svg viewBox="0 0 18 12" width="18" height="12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 17 12" width="17" height="12"><path d="M8.5 2.4c2.2 0 4.2.9 5.7 2.3l1.2-1.3A10.3 10.3 0 0 0 8.5.6C5.8.6 3.3 1.7 1.6 3.4l1.2 1.3A8.4 8.4 0 0 1 8.5 2.4Zm0 3.6c1.2 0 2.3.5 3.2 1.2l1.2-1.3a6.7 6.7 0 0 0-8.8 0l1.2 1.3c.9-.7 2-1.2 3.2-1.2Zm0 3.4c-.6 0-1.1.2-1.5.6l1.5 1.6 1.5-1.6c-.4-.4-.9-.6-1.5-.6Z"/></svg><svg viewBox="0 0 27 13" width="27" height="13"><rect x=".5" y=".5" width="22" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="19" height="9" rx="2.2"/><path d="M24.5 4.5v4c.9-.3 1.5-1.2 1.5-2s-.6-1.7-1.5-2Z" opacity=".5"/></svg></span></div>`;

const bell = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.6 5.8 2 6.5H4c.4-.7 2-2 2-6.5Z"/><path d="M10 19a2.2 2.2 0 0 0 4 0"/></svg>`;
const trophy = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5.5c0 3 1 4.5 3 5M16 6h2.5c0 3-1 4.5-3 5M12 13v4M8.5 20h7M10 17h4"/></svg>`;
const bolt = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M13.6 2 5 13.4h5.4L9.6 22 19 9.8h-5.6L13.6 2Z"/></svg>`;
const chevron = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m9.5 5.5 6.5 6.5-6.5 6.5"/></svg>`;
const heart = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/></svg>`;
const calendar = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.5" width="16" height="14" rx="3"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/></svg>`;

const frame = (label, className, body) =>
  `<div class="app-phone ${className}" role="img" aria-label="${label}"><div class="ap-screen" aria-hidden="true">${statusBar}${body}</div></div>`;

export const homePhone = () =>
  frame(
    "The Wellstaq app home screen greeting a member and showing their points and daily check-in streak",
    "ap-home",
    `<div class="ap-top"><div class="ap-chip"><span class="ap-avatar">YA</span><span class="ap-points">${trophy}1pts</span></div><span class="ap-bell">${bell}<i>2</i></span></div>
<p class="ap-hello">Good evening</p>
<p class="ap-title">Yemi, here's how you are doing today.</p>
<div class="ap-streak"><b>05</b><span>Day check-in<br>streak</span><span class="ap-bolt">${bolt}</span></div>`,
  );

export const checkinPhone = () =>
  frame(
    "The Wellstaq app daily check-in prompt asking how you are, with a button to start today's check-in",
    "ap-checkin",
    `<div class="ap-card"><span class="ap-orb"></span><p class="ap-eyebrow">Your Daily Check-In</p><p class="ap-q">How are you?</p><div class="ap-start"><span>Start today's check-in</span>${chevron}</div></div>
<div class="ap-tiles"><div class="ap-tile"><span class="ap-ico ap-ico-green">${heart}</span><b>Mood</b></div><div class="ap-tile"><span class="ap-ico ap-ico-blue">${calendar}</span><b>Events</b></div></div>`,
  );
