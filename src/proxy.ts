import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PUBLIC_ROUTES = ["/sign-in", "/request-access", "/account-pending"];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const path = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => path.startsWith(route));
  const isPortalRoute = path.startsWith("/portal");
  const isApiRoute = path.startsWith("/api");

  if (!user && !isPublicRoute && !isApiRoute && path !== "/") {
    const redirectUrl = new URL(isPortalRoute ? "/sign-in" : "/sign-in", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
