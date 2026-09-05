import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "mil_home_session";
// /account is reachable whether or not there's a session — it renders the login
// form itself when logged out, so the middleware must not redirect it to /login.
const PUBLIC_PATHS = ["/login", "/signup", "/account"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/heartbeat");
  const hasCookie = Boolean(request.cookies.get(COOKIE_NAME)?.value);

  if (!isPublic && !hasCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images|favicon.ico).*)"],
};
