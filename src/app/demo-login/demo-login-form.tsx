"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function DemoLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/demo/session", {
      body: JSON.stringify({ username, password }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    setSubmitting(false);
    if (!response.ok) {
      setError("The username or password is incorrect. Check your details and try again.");
      return;
    }

    router.push("/demo");
  }

  return (
    <div className="auth-card">
      <p className="eyebrow">Local testing only</p>
      <h2>Local demo login</h2>
      <p className="notice" role="status">No live data. This opens the in-memory demonstration only.</p>
      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        <label className="field-label" htmlFor="demo-username">
          Test username
          <input
            autoCapitalize="none"
            autoComplete="username"
            className="text-input"
            disabled={submitting}
            id="demo-username"
            name="username"
            onChange={(event) => setUsername(event.target.value)}
            required
            spellCheck={false}
            type="text"
            value={username}
          />
        </label>
        <label className="field-label" htmlFor="demo-password">
          Test password
          <input
            autoComplete="current-password"
            className="text-input"
            disabled={submitting}
            id="demo-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error ? <p className="notice notice--error" role="alert">{error}</p> : null}
        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? "Opening demo…" : "Open local demo"}
        </button>
        <p className="auth-help">Test access: username <strong>kyle.robb</strong>, password <strong>demo</strong>.</p>
      </form>
    </div>
  );
}
