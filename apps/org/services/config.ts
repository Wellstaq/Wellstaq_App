// path: services/config.ts
export const API_BASE_URL = "https://wellstaq.up.railway.app";

export const backendPath = (path: string) => `${API_BASE_URL}${path}`;
