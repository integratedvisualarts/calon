import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, WORKSPACE_COOKIE, readSession } from "@/lib/session";

/** Everything except the sign-in page, its API and static assets needs a valid session. */
export async function middleware(request: NextRequest) {
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value, process.env.SESSION_SECRET);
  const { pathname } = request.nextUrl;
  const onLogin = pathname === "/login";

  if (!session) {
    if (onLogin) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (onLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  // Keep the readable workspace hint in step with the signed session.
  const res = NextResponse.next();
  if (request.cookies.get(WORKSPACE_COOKIE)?.value !== session.w) {
    res.cookies.set(WORKSPACE_COOKIE, session.w, { httpOnly: false, sameSite: "lax", path: "/" });
  }
  return res;
}

export const config = {
  matcher: ["/((?!api/login|api/logout|_next/static|_next/image|brand/|food/|templates/|favicon.ico|icon.png|sw.js).*)"],
};
