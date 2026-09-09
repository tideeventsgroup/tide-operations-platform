import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";

type InternalRole = "admin" | "event_control" | "fmic" | "staff" | "view_only";

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      name: "Internal access",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = typeof credentials?.username === "string" ? credentials.username.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!username || !password) return null;

        const client = createServiceSupabaseClient();
        const { data, error } = await client
          .from("internal_users")
          .select("id, display_name, role, password_hash, is_active")
          .eq("username", username)
          .maybeSingle();

        if (error || !data?.is_active || !data.password_hash) return null;
        if (!(await bcrypt.compare(password, data.password_hash))) return null;

        return { id: data.id, name: data.display_name, role: data.role as InternalRole };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as InternalRole;
      }
      return session;
    },
    authorized({ auth: session, request }) {
      const isSignIn = request.nextUrl.pathname === "/sign-in";
      if (isSignIn) return true;
      return Boolean(session?.user);
    },
  },
  session: { strategy: "jwt" },
});
