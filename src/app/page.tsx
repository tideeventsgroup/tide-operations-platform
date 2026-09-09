import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isLocalDemoEnabled } from "@/modules/demo/local-demo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const requestHeaders = await headers();
  if (isLocalDemoEnabled(process.env.SENTIAL_LOCAL_DEMO, requestHeaders.get("host"))) {
    redirect("/demo-login");
  }
  redirect("/sign-in");
}
