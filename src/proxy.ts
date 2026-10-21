import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "./lib/auth/helpers";

const authRoutes = new Set(["/sign-in", "/sign-up"]);
const protectedRoutes = ["/orders", "/checkout", "/payment"];
const adminRoutes = ["/dashboard"];

const matchesRoutePrefix = (pathname: string, route: string) => {
  return pathname === route || pathname.startsWith(`${route}/`);
};

const redirectTo = (request: NextRequest, pathname: string) => {
  return NextResponse.redirect(new URL(pathname, request.url));
};

// Handle routing for all roles and users
export const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const isAuthRoute = authRoutes.has(pathname);
  const isAdminRoute = adminRoutes.some((route) =>
    matchesRoutePrefix(pathname, route),
  );
  const isProtectedRoute = protectedRoutes.some((route) =>
    matchesRoutePrefix(pathname, route),
  );

  if (!isAuthRoute && !isAdminRoute && !isProtectedRoute) {
    return NextResponse.next();
  }

  const { userId, user } = await getCurrentUser(request.headers);

  if (!userId || !user) {
    if (!isProtectedRoute && !isAdminRoute) {
      return NextResponse.next();
    }

    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set(
      "callbackUrl",
      `${pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(signInUrl);
  }

  const role = user.role;

  if (isAdminRoute && role !== "admin") {
    return redirectTo(request, "/");
  }

  if (isAuthRoute) {
    return redirectTo(request, user.role === "admin" ? "/dashboard" : "/");
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    "/sign-in",
    "/sign-up",
    "/dashboard/:path*",
    "/orders/:path*",
    "/checkout",
    "/payment/:path*",
  ],
};
