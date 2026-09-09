import { createClient } from "@supabase/supabase-js";
import { readServerEnvironment } from "@/config/env";

export function createServiceSupabaseClient() {
  const environment = readServerEnvironment(process.env);

  return createClient(environment.supabaseUrl, environment.supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
