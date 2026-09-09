type Environment = Record<string, string | undefined>;

export type ServerEnvironment = {
  supabaseSecretKey: string;
  supabaseUrl: string;
};

const serverVariables = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"] as const;

/**
 * The operational database is only available from server code. No Supabase
 * URL/key is read by browser bundles after the Auth.js cutover.
 */
export function readServerEnvironment(environment: Environment): ServerEnvironment {
  const missingVariables = serverVariables.filter((key) => !environment[key]);

  if (missingVariables.length > 0) {
    throw new Error(`Missing required server environment variables: ${missingVariables.join(", ")}`);
  }

  return {
    supabaseUrl: requireUrl(environment.SUPABASE_URL),
    supabaseSecretKey: environment.SUPABASE_SECRET_KEY as string,
  };
}

function requireUrl(value: string | undefined): string {
  if (!value) throw new Error("SUPABASE_URL is required");

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error("SUPABASE_URL must be a valid URL");
  }
}
