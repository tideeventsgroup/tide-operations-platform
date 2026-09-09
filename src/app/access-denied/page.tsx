import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="auth-shell">
      <section className="auth-brief">
        <div>
          <p className="brand-kicker">Sential / Access control</p>
          <h1>Access is controlled by event assignment.</h1>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">Access unavailable</p>
          <h1>We can’t open that operational record.</h1>
          <p>
            This account does not have permission for the requested event, or the
            event is no longer available.
          </p>
          <Link className="secondary-link" href="/select-event">View authorised events</Link>
        </div>
      </section>
    </main>
  );
}
