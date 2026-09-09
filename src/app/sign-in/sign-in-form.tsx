"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SignInForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (!username.trim() || !password) {
      setError("The username or password is incorrect. Check your details and try again.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn("credentials", {
        username: username.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!result?.ok) {
        setError("The username or password is incorrect. Check your details and try again.");
        return;
      }

      router.replace("/select-event");
      router.refresh();
    } catch {
      setError("The username or password is incorrect. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <p className="eyebrow">Internal access</p>
      <h2>Sign in to operations</h2>
      <p>Use your assigned username and password.</p>
      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        <label className="field-label" htmlFor="username">Username
          <input aria-describedby={error ? "credentials-error" : undefined} aria-invalid={error ? true : undefined} className="text-input" id="username" name="username" type="text" autoCapitalize="none" autoComplete="username" spellCheck={false} value={username} onChange={(event) => setUsername(event.target.value)} disabled={submitting} required />
        </label>
        <label className="field-label" htmlFor="password">Password
          <span className="password-field">
            <input aria-describedby={error ? "credentials-error" : undefined} aria-invalid={error ? true : undefined} className="text-input" id="password" name="password" type={passwordVisible ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={submitting} required />
            <button aria-label={passwordVisible ? "Hide password" : "Show password"} aria-pressed={passwordVisible} className="password-toggle" disabled={submitting} onClick={() => setPasswordVisible((visible) => !visible)} type="button">{passwordVisible ? "Hide" : "Show"}</button>
          </span>
        </label>
        {error ? <p className="notice notice--error" id="credentials-error" role="alert">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Verifying access…" : "Sign in securely"}</button>
        <p className="auth-help">Access is managed by the Tide Events Group operational team.</p>
      </form>
    </div>
  );
}
