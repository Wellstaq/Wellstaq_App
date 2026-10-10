export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;

  if (process.env.ADMIN_PREVIEW_MODE === "true") {
    throw new Error("ADMIN_PREVIEW_MODE must not be enabled in production");
  }
  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) throw new Error("Production requires BACKEND_API_URL");
  const { protocol, hostname } = new URL(backendUrl);
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  if (protocol !== "https:" && !isLocal) throw new Error("BACKEND_API_URL must use HTTPS in production");
}
