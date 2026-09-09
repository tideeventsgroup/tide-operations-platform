import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isLocalDemoEnabled } from "@/modules/demo/local-demo";
import { DemoLoginForm } from "./demo-login-form";

export const dynamic = "force-dynamic";

export default async function DemoLoginPage() {
  const requestHeaders = await headers();
  if (!isLocalDemoEnabled(process.env.SENTIAL_LOCAL_DEMO, requestHeaders.get("host"))) notFound();

  const cookieStore = await cookies();
  if (cookieStore.get("sential_demo_session")?.value === "1") redirect("/demo");

  return (
    <main className="auth-shell">
      <section className="auth-brief" aria-labelledby="demo-login-title">
        <div>
          <p className="brand-kicker">Sential / Local demo</p>
          <h1 id="demo-login-title">Test the Event Control workspace safely.</h1>
          <p>This local-only workspace uses simulated browser data and cannot access a live event.</p>
        </div>
        <footer>Local testing only. No live operational records are created.</footer>
      </section>
      <section aria-label="Local demo login" className="auth-panel"><DemoLoginForm /></section>
    </main>
  );
}
