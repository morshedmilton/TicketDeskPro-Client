import { NextRequest, NextResponse } from "next/server";

/**
 * Route gate (FRD): runs on the EDGE before any page renders.
 * - No token  -> /login
 * - Role-gated areas require a matching "role" claim in the JWT payload.
 * The token arrives via the readable `tdp_access` cookie mirrored at login;
 * the API remains the only real trust anchor — this is UX gating, not security.
 */

const PROTECTED_PREFIXES = ["/dashboard", "/tickets", "/notifications", "/profile"];
const AGENT_PREFIXES = ["/tickets/queue"];
const ADMIN_PREFIXES = ["/admin", "/users", "/audit-logs"];

function rolesFromToken(token: string): string[] {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64)) as { role?: string | string[] };
    if (Array.isArray(payload.role)) return payload.role;
    if (typeof payload.role === "string") return [payload.role];
    return [];
  } catch {
    return [];
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("tdp_access")?.value;

  const needsAuth =
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) ||
    ADMIN_PREFIXES.some((p) => pathname.startsWith(p)) ||
    AGENT_PREFIXES.some((p) => pathname.startsWith(p));

  if (!needsAuth) return NextResponse.next();

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const roles = rolesFromToken(token);

  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p)) && !roles.some((r) => r === "Admin" || r === "SuperAdmin")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (AGENT_PREFIXES.some((p) => pathname.startsWith(p)) && !roles.some((r) => r === "Agent" || r === "Admin" || r === "SuperAdmin")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/tickets/:path*", "/notifications/:path*", "/profile/:path*", "/admin/:path*", "/users/:path*", "/audit-logs/:path*"],
};
