// path: services/config.ts
// Client-side fetches hit this directly (browser → backend), so it needs
// the NEXT_PUBLIC_ prefix to be inlined into the bundle. Falls back to
// production so nothing breaks for anyone who hasn't set it locally.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://wellstaq.up.railway.app";

export const backendPath = (path: string) => `${API_BASE_URL}${path}`;
