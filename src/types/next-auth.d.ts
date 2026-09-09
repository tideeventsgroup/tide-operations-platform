import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User { role?: "admin" | "event_control" | "fmic" | "staff" | "view_only" }
  interface Session { user: { id: string; role: "admin" | "event_control" | "fmic" | "staff" | "view_only" } & DefaultSession["user"] }
}

declare module "next-auth/jwt" {
  interface JWT { role?: "admin" | "event_control" | "fmic" | "staff" | "view_only" }
}
