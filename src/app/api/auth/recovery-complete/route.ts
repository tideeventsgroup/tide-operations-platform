import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ complete: true });
  response.cookies.set("sential_recovery", "", { maxAge: 0, path: "/" });
  return response;
}
