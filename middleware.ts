import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/auth/constants";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/clients",
  "/projects",
  "/payments",
  "/employees",
  "/profile",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function getSecret(): Uint8Array | null {
  const raw = process.env.AUTH_SECRET?.trim();
  if (!raw) return null;
  return new TextEncoder().encode(raw);
}

type SessionCheck = {
  authenticated: boolean;
  mustChangePassword: boolean;
};

async function getSessionCheck(request: NextRequest): Promise<SessionCheck> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = getSecret();
  if (!token || !secret) {
    return { authenticated: false, mustChangePassword: false };
  }
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return {
      authenticated: true,
      mustChangePassword: payload.mustChangePassword === true,
    };
  } catch {
    return { authenticated: false, mustChangePassword: false };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { authenticated, mustChangePassword } = await getSessionCheck(request);

  if (pathname === "/") {
    if (!authenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(
      new URL(
        mustChangePassword ? "/change-password" : "/dashboard",
        request.url
      )
    );
  }

  if (pathname === "/change-password") {
    if (!authenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!mustChangePassword) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (authenticated) {
      return NextResponse.redirect(
        new URL(
          mustChangePassword ? "/change-password" : "/dashboard",
          request.url
        )
      );
    }
    return NextResponse.next();
  }

  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (authenticated && mustChangePassword && isProtectedPath(pathname)) {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  if (isProtectedPath(pathname) && !authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/change-password",
    "/dashboard/:path*",
    "/clients/:path*",
    "/projects/:path*",
    "/payments/:path*",
    "/employees/:path*",
    "/profile",
    "/settings",
    "/settings/:path*",
  ],
};
