import { NextResponse } from "next/server";
import { isLocalDemoEnabled, isValidLocalDemoCredentials } from "@/modules/demo/local-demo";

const demoSessionCookie = "sential_demo_session";

export async function POST(request: Request) {
  if (!isLocalDemoEnabled(process.env.SENTIAL_LOCAL_DEMO, request.headers.get("host"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const credentials = await readCredentials(request);
  if (!credentials || !isValidLocalDemoCredentials(credentials.username, credentials.password)) {
    return NextResponse.json({ error: "The username or password is incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(demoSessionCookie, "1", {
    httpOnly: true,
    maxAge: 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
  });
  return response;
}

async function readCredentials(request: Request): Promise<{ username: string; password: string } | null> {
  try {
    const body: unknown = await request.json();
    if (!isCredentials(body)) return null;
    return body;
  } catch {
    return null;
  }
}

function isCredentials(value: unknown): value is { username: string; password: string } {
  if (!value || typeof value !== "object") return false;
  const { username, password } = value as Record<string, unknown>;
  return typeof username === "string" && typeof password === "string";
}
