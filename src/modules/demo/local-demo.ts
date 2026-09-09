const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
const demoUsername = "kyle.robb";
const demoPassword = "demo";

export function isLocalDemoEnabled(enabled: string | undefined, host: string | null): boolean {
  if (enabled !== "true" || !host) return false;
  const hostname = host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0];
  return localHosts.has(hostname.toLowerCase());
}

export function isValidLocalDemoCredentials(username: string, password: string): boolean {
  return username.trim().toLowerCase() === demoUsername && password === demoPassword;
}
