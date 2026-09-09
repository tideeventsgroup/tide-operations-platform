import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Headers": "apikey, authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  Vary: "Origin",
};

const invalidCredentials = () => Response.json(
  { error: "invalid_credentials" },
  { headers: corsHeaders, status: 401 },
);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { headers: corsHeaders, status: 405 });
  }

  try {
    const credentials = await request.json();
    const username = normalizeUsername(credentials?.username);
    const password = typeof credentials?.password === "string" ? credentials.password : "";

    if (!isValidUsername(username) || password.length === 0 || password.length > 1024) {
      return invalidCredentials();
    }

    const url = requireEnvironment("SUPABASE_URL");
    const serviceRoleKey = requireEnvironment("SUPABASE_SERVICE_ROLE_KEY");
    const publishableKey = requireEnvironment("SUPABASE_ANON_KEY");
    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: alias } = await admin
      .from("login_aliases")
      .select("profile_id")
      .eq("username", username)
      .maybeSingle();
    const resolvedUser = alias
      ? await admin.auth.admin.getUserById(alias.profile_id)
      : { data: { user: null } };
    const email = resolvedUser.data.user?.email ?? `invalid-${username}@sential.invalid`;
    const auth = createClient(url, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await auth.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      return invalidCredentials();
    }

    return Response.json({ session: data.session }, { headers: corsHeaders });
  } catch {
    return invalidCredentials();
  }
});

function normalizeUsername(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidUsername(value: string): boolean {
  return /^[a-z][a-z0-9._-]{2,79}$/.test(value);
}

function requireEnvironment(key: string): string {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing ${key}`);
  }
  return value;
}
