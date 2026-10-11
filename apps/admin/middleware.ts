import { NextRequest, NextResponse } from "next/server";
import { SESSION_MARKER_COOKIE } from "@/lib/bff";
import { isPreviewEnabled } from "@/lib/preview";

const PUBLIC_PAGES = ["/login", "/forgot-password", "/reset-password"];

// This is a routing convenience only. Authorization is enforced by the
// backend on every /app-admin request the BFF forwards.
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPublicPage = PUBLIC_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));
  const hasSession = isPreviewEnabled(process.env) || request.cookies.has(SESSION_MARKER_COOKIE);

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!hasSession && !isPublicPage) {
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("returnTo", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!api/|_next/|icon.svg|favicon.ico|assets/).*)"],
};
