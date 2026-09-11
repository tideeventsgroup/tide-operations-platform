export { auth as proxy } from "@/auth";

export const config = {
  /*
   * Everything is behind the session guard except:
   * - api/auth      Auth.js needs to run before a session exists.
   * - api/health    Uptime monitoring must not be redirected to sign-in.
   * - manifest/sw   A browser fetches these before the user signs in. If they
   *                 redirect, the app cannot be installed to a home screen.
   * - static assets Icons and images carry no operational data.
   */
  matcher: [
    "/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
