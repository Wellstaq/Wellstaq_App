// path: services/config.ts
// Browser code never talks to the backend directly — it calls this
// same-origin BFF proxy (app/api/backend/[...path]/route.ts), which holds
// BACKEND_API_URL server-side only and keeps tokens out of browser JS via
// httpOnly cookies. See apps/admin's equivalent for the pattern this follows.
const BFF_BASE = "/api/backend";

export const backendPath = (path: string) => `${BFF_BASE}${path}`;
