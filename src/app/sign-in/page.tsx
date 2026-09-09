import Image from "next/image";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <main className="auth-shell">
      <section className="auth-brief" aria-labelledby="sign-in-context-title">
        <div>
          <p className="brand-kicker">Event incident management platform</p>
          <h1 id="sign-in-context-title">Clear decisions begin with a clear operational picture.</h1>
          <p>
            Secure internal access for Event Control teams managing live incidents,
            operational records and event readiness.
          </p>
        </div>
        <footer><span aria-hidden="true" />Authorised operational personnel only</footer>
      </section>
      <section className="auth-panel" aria-label="Sign in">
        <div className="auth-panel-content">
          <Image
            className="auth-logo"
            src="/branding/sentinel-logo.png"
            width={2172}
            height={724}
            sizes="(max-width: 760px) calc(100vw - 48px), 340px"
            alt="Sentinel, event incident management platform"
            priority
          />
          <SignInForm />
        </div>
      </section>
    </main>
  );
}
