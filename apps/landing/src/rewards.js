import { homePhone } from "./app-phone.js";
export function rewardsSection({ button, eyebrow, icon, appUrl, demoUrl }) {
  const steps = [
    [
      "activity",
      "Take part",
      "Join wellbeing activities and challenges. Make time for habits that help you feel better, and stay engaged with your team.",
    ],
    [
      "trophy",
      "Earn rewards",
      "Earn rewards through engagement and activities. Give your everyday effort a little extra recognition.",
    ],
    [
      "wallet",
      "Redeem for real cash",
      "Turn your earned rewards into real cash. Take something tangible away from the time you invest in your wellbeing.",
    ],
  ];
  return `<section class="rewards-hero light" id="rewards" aria-labelledby="rewards-title"><div class="frame rewards-hero-grid"><div class="rewards-hero-copy" data-reveal>${eyebrow("Engagement & rewards")}<h2 id="rewards-title">Better wellbeing. <span>Real rewards.</span></h2><p>Give your people another reason to keep showing up. Wellstaq rewards engagement and wellbeing activities, so healthier habits can come with something tangible: rewards that can be redeemed for real cash.</p><div class="rewards-actions">${button("Request a Demo", demoUrl)}${button("Get Started", appUrl, "outline")}</div></div><div class="reward-visual" role="img" aria-label="Preview of a rewards store where earned coins can be used to shop for rewards or redeemed for real cash" data-reveal style="--d:90ms">
${homePhone()}</div></div><div class="frame rewards-steps-frame"><div class="reward-steps">${steps.map(([glyph, title, text], i) => `<article class="reward-step" data-reveal style="--d:${i * 80}ms"><div class="reward-step-top"><span class="reward-step-number">0${i + 1}</span><span class="reward-step-icon">${icon(glyph)}</span></div><h3>${title}</h3><p>${text}</p></article>`).join("")}</div></div></section>`;
}
