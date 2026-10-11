// path: middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { SESSION_MARKER_COOKIE } from "@/lib/bff";

export function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DATA_SOURCE !== "api") return NextResponse.next();

  // Checked instead of the access-token cookie itself: the access token is
  // short-lived and refreshed transparently by the BFF proxy per-request,
  // so gating navigation on it would bounce a signed-in user to /login the
  // moment it expires, even though their refresh token (and this marker,
  // which shares its lifetime) is still good.
  const isAuthenticated = request.cookies.has(SESSION_MARKER_COOKIE);
  const { pathname } = request.nextUrl;

  // Authenticated users shouldn't see the login/onboarding screens —
  // send them straight to the dashboard, before any page renders.
  if (isAuthenticated && (pathname === "/login" || pathname.startsWith("/onboarding"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Unauthenticated users can't reach protected dashboard routes.
  if (!isAuthenticated && pathname.startsWith("/dashboard")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/dashboard/:path*", "/login", "/onboarding/:path*"],
};
