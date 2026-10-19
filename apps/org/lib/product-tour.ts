export type TourPreview = "workspace" | "insights" | "people" | "space" | "events" | "settings";
export type TourKind = "dashboard" | "page";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  tips?: string[];
  target?: string;
  navigation?: boolean;
  preview: TourPreview;
}

export const OPEN_TOUR_EVENT = "wellstaq:open-tour";
const anchor = (id: string) => `[data-tour="${id}"]`;

// Version the browser-only preference without storing personal profile data.
export function tourStorageKey(userId: string, organizationId: string) {
  return `wellstaq:tour:v1:${encodeURIComponent(organizationId)}:${encodeURIComponent(userId)}`;
}

export const DASHBOARD_TOUR: readonly TourStep[] = [
  { id: "welcome", title: "Find your way around Wellstaq", description: "Follow the spotlight to learn what your menus and controls do.", tips: ["Nothing changes during this tour. You’re just looking around.", "Skip any time, and replay from Guide when you need a hand."], target: anchor("main-navigation"), navigation: true, preview: "workspace" },
  { id: "scope", title: "Start with the right workspace", description: "This selector sets the context for your dashboard.", tips: ["Overview brings your organization together. Choose a branch to focus on its people and activity.", "The branches and actions you see depend on your permissions."], target: anchor("scope"), navigation: true, preview: "workspace" },
  { id: "navigation", title: "Your day-to-day, all in one place", description: "Use these menus to move around your workspace.", tips: ["Dashboard gives you the big picture. Insights explores wellbeing and engagement over time.", "Department organizes people into smaller teams. Space connects them. Events brings them together."], target: anchor("main-navigation"), navigation: true, preview: "insights" },
  { id: "team", title: "Get to know your people", description: "Team shows who belongs to your organization or selected branch.", tips: ["Search for a teammate and open their profile where available.", "With the right permissions, invite people or manage their branch, department, and role."], target: anchor("nav-team"), navigation: true, preview: "people" },
  { id: "space", title: "Make room for connection", description: "Space is your team’s shared feed for updates, stories, and conversations.", tips: ["Share a milestone or wellness tip, and react or reply to colleagues.", "Clubs bring people with shared interests together."], target: anchor("nav-space"), navigation: true, preview: "space" },
  { id: "challenges", title: "Give your team something to aim for", description: "Challenges make healthy habits a shared activity.", tips: ["Open Challenges to discover activities, follow progress, and view leaderboards.", "Use Events for scheduled activities. Creation controls appear when you have permission."], target: anchor("nav-challenges"), navigation: true, preview: "events" },
  { id: "settings", title: "Make Wellstaq work for you", description: "Settings is home to your profile, account security, and preferences.", tips: ["Manage the settings available to your account.", "Organization settings, roles, and billing are permission-based. Contact Support is nearby if you need help."], target: anchor("nav-settings"), navigation: true, preview: "settings" },
  { id: "tools", title: "A few useful shortcuts", description: "Your top bar keeps everyday tools close.", tips: ["Search finds teammates, clubs, challenges, events, and settings. Notifications keeps you up to date.", "Ask ws-AI opens the assistant. Your profile menu links to your account and sign-out controls."], target: anchor("top-bar"), preview: "workspace" },
  { id: "guide", title: "You don’t have to remember it all", description: "Use Guide on any page for a closer look at its buttons, filters, and content.", tips: ["The page guide follows the controls actually available to you.", "To replay this introduction, choose Dashboard tour in your profile menu."], target: anchor("guide"), preview: "workspace" },
];

interface PageGuide {
  title: string;
  description: string;
  preview: TourPreview;
  steps?: TourStep[];
}

const PAGE_GUIDES: Record<string, PageGuide> = {
  dashboard: { title: "Your dashboard, at a glance", description: "A snapshot of people, engagement, and activity in your current workspace.", preview: "insights", steps: [
    { id: "period", title: "Look at the right time period", description: "Choose a reporting period, or a custom date range, to update your dashboard metrics.", target: 'main [aria-label="Dashboard period"]', preview: "insights" },
    { id: "metrics", title: "Go beyond the headline numbers", description: "These cards summarize your workspace. Linked cards open the relevant team, insights, events, or challenges page.", target: anchor("dashboard-metrics"), preview: "insights" },
  ] },
  insights: { title: "Understand how your team is doing", description: "Insights brings wellbeing and engagement trends together. Read the charts alongside the reporting period and current branch scope.", preview: "insights", steps: [
    { id: "insights-period", title: "Change the reporting window", description: "Choose the period you want to explore. The charts update for that window.", target: anchor("insights-period"), preview: "insights" },
  ] },
  teams: { title: "Find and manage your team", description: "See members, their branch, department, role, and status. Click a member row to see management options when you have permission.", preview: "people", steps: [
    { id: "invite", title: "Bring someone into the team", description: "Add Team Member opens an invitation form. Choose their branch, department, and role, then review and send the invitation.", target: anchor("invite-member"), preview: "people" },
    { id: "members", title: "Read the team directory", description: "Use the table to check membership and assignments. A linked name opens the profile if it is available to you.", target: "main table", preview: "people" },
  ] },
  departments: { title: "Give every team a place", description: "Departments group people within a branch. Choose a department to explore its members and activity.", preview: "people", steps: [
    { id: "create-department", title: "Create a department", description: "Open the creation form to name a department and choose its members. This action is available in a branch when you have permission.", target: anchor("create-department"), preview: "people" },
    { id: "department-list", title: "Open a department", description: "These cards show departments and their membership counts. Select one to view its details and the actions available to you.", target: "#department-list", preview: "people" },
  ] },
  events: { title: "Bring people together", description: "Discover events, check their status, and open an event to see participation and chat.", preview: "events", steps: [
    { id: "create-event", title: "Plan an event", description: "Create Event opens a form for the activity details, timing, location, and participants. Nothing is created until you submit it.", target: anchor("create-event"), preview: "events" },
    { id: "events-list", title: "Find your next activity", description: "Search and use the status tabs to narrow the list. Open an event card to see its details and available actions.", target: "#event-list", preview: "events" },
  ] },
  challenges: { title: "Build healthy habits together", description: "Discover wellness challenges, follow your progress, and see how the community is doing.", preview: "events", steps: [
    { id: "create-challenge", title: "Set up a challenge", description: "Create Challenge opens the setup form for goals, dates, participation, and evidence requirements. Available options depend on your permissions.", target: anchor("create-challenge"), preview: "events" },
    { id: "challenge-list", title: "Find a challenge to join", description: "Use the search and filters to narrow the list. Open a challenge to read its rules, participation options, and leaderboard.", target: "#challenge-list", preview: "events" },
  ] },
  space: { title: "Your team’s shared space", description: "Catch up on your organization’s feed, share updates, and connect through clubs.", preview: "space", steps: [
    { id: "feed", title: "Choose the conversation", description: "Switch between All posts, My Branch when available, and General. These tabs change what you read, not where you publish.", target: anchor("feed-views"), preview: "space" },
    { id: "composer", title: "Share something with your team", description: "Write an update, add media if you like, and check the audience before choosing Post. The tour won’t publish anything.", target: anchor("post-composer"), preview: "space" },
  ] },
  settings: { title: "Your account, your preferences", description: "Choose a section to manage your profile, security, notifications, or privacy. Additional organization options appear only when permitted.", preview: "settings", steps: [
    { id: "settings-sections", title: "Choose what to manage", description: "Each section opens its own controls. Security includes your password, two-factor authentication, and active sessions. Organization settings are permission-based.", target: anchor("settings-sections"), preview: "settings" },
    { id: "settings-save", title: "Keep the changes you want", description: "Save Changes applies edits in the current settings section. Discard Changes restores its saved values. Some security and organization actions have their own save or confirmation controls.", target: anchor("settings-save"), preview: "settings" },
  ] },
  invites: { title: "Keep track of invitations", description: "Search pending invitations and check their branch and expiry date. Cancel withdraws an invitation after confirmation.", preview: "people" },
  clubs: { title: "Find your people", description: "Browse clubs and open one to view its details. Join or manage membership using the controls available to you.", preview: "space" },
  contact: { title: "A hand when you need it", description: "Use the support form to describe your question. Review your message before sending it to the Wellstaq team.", preview: "people", steps: [
    { id: "support-form", title: "Tell us what’s happening", description: "Complete the form and choose Send Message. Include enough detail to help the support team understand your question, but never share a password or verification code.", target: "main form", preview: "people" },
  ] },
  integrations: { title: "Explore your connections", description: "Browse integrations and their connection status. Disabled connection buttons are not currently available.", preview: "settings" },
  notifications: { title: "Stay in the loop", description: "Filter updates by category, open linked activity, and mark notifications as read using the controls on this page.", preview: "workspace" },
  messages: { title: "Keep the conversation going", description: "Choose an available team conversation, then use its message field to write and send a reply. Messaging access depends on your account.", preview: "space" },
  "wellbeing-pulse": { title: "Set your check-in rhythm", description: "Choose how often your organization receives wellbeing check-ins. Review and confirm the cadence before saving.", preview: "insights" },
  profile: { title: "Get to know a teammate", description: "This profile shows the details its owner shares with you. Private information and unavailable profiles stay restricted.", preview: "people" },
};

export function getPageTour(pathname: string): TourStep[] {
  const segments = pathname.split("/").filter(Boolean);
  const section = segments[1] ?? "dashboard";
  const detail = segments.length > 2;
  const guide = PAGE_GUIDES[section] ?? { title: "Find your way around", description: "Explore this page’s content and available controls. Your permissions determine which actions appear.", preview: "workspace" as const };
  const intro: TourStep = { id: `page-${section}`, title: guide.title, description: guide.description, target: "main .page-title", preview: guide.preview };
  if (detail && (section === "events" || section === "challenges")) {
    return [{ ...intro, title: section === "events" ? "Everything about this event" : "Your challenge, up close", description: section === "events" ? "Read the event details, check participation, and use the chat where available. Join, invite, and management actions depend on the event and your account." : "Read the challenge rules, follow progress, and explore its leaderboard. Joining and submission actions depend on the challenge and your account." }];
  }
  return [intro,
    { id: "page-search", title: "Find what you’re looking for", description: "Type here to narrow the content on this page. Clear your search to see the full list again.", target: 'main input[type="search"], main input[placeholder^="Search"]', preview: guide.preview },
    ...(guide.steps ?? []),
    { id: "page-finish", title: "You’re ready to explore", description: "Use Guide whenever you need another look. Your profile menu also includes the full dashboard tour.", target: anchor("guide"), preview: "workspace" },
  ];
}

export interface TourRect { left: number; top: number; width: number; height: number; }

/** Keep the card on-screen and beside the highlight where space permits. */
export function placeTourCard(target: TourRect | null, viewport: { width: number; height: number }, card: { width: number; height: number }) {
  const margin = 16;
  const gap = 20;
  const width = Math.min(card.width, viewport.width - margin * 2);
  const height = Math.min(card.height, viewport.height - margin * 2);
  const clamp = (n: number, max: number) => Math.max(margin, Math.min(n, max - margin));
  const centered = { left: (viewport.width - width) / 2, top: (viewport.height - height) / 2 };
  if (!target) return { ...centered, width };
  const right = target.left + target.width;
  const bottom = target.top + target.height;
  if (viewport.width >= 760 && right + gap + width <= viewport.width - margin) return { left: right + gap, top: clamp(target.top - 24, viewport.height - height), width };
  if (viewport.width >= 760 && target.left - gap - width >= margin) return { left: target.left - gap - width, top: clamp(target.top - 24, viewport.height - height), width };
  if (bottom + gap + height <= viewport.height - margin) return { left: clamp(target.left, viewport.width - width), top: bottom + gap, width };
  if (target.top - gap - height >= margin) return { left: clamp(target.left, viewport.width - width), top: target.top - gap - height, width };
  return { left: centered.left, top: target.top < viewport.height / 2 ? viewport.height - height - margin : margin, width };
}
