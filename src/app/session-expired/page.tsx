import Link from "next/link";

export default function SessionExpiredPage() {
  return (
    <main className="auth-shell">
      <section className="auth-brief">
        <div>
          <p className="brand-kicker">Sential / Secure session</p>
          <h1>Sign in again to continue safely.</h1>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">Session expired</p>
          <h1>Your secure session is no longer active.</h1>
          <p>
            This can happen when a secure link has expired or when your session has
            been signed out. No operational information has been changed.
          </p>
          <Link className="secondary-link" href="/sign-in">Return to sign in</Link>
        </div>
      </section>
    </main>
  );
}
