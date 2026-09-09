import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isLocalDemoEnabled } from "@/modules/demo/local-demo";
import { DemoControlConsole } from "./demo-control-console";

export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const requestHeaders = await headers();
  if (!isLocalDemoEnabled(process.env.SENTIAL_LOCAL_DEMO, requestHeaders.get("host"))) notFound();
  const cookieStore = await cookies();
  if (cookieStore.get("sential_demo_session")?.value !== "1") redirect("/demo-login");
  return <DemoControlConsole />;
}
