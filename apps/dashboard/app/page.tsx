"use client";

// Login. Establishes the tenant session (token + config) that themes and
// scopes everything else. Simple demo credentials for now, but shaped like
// real auth: swap the login call and nothing else changes.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession, login } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [shop, setShop] = useState("dadus");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getSession()) router.replace("/insights");
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(shop.trim().toLowerCase(), password);
      router.replace("/insights");
    } catch (err) {
      setError(err instanceof Error ? err.message : "login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <div>
          <div className="page-title">Welcome back</div>
          <div className="muted">Sign in to your shop dashboard</div>
        </div>
        <div>
          <label className="stat-label">Shop ID</label>
          <input type="text" value={shop} onChange={(e) => setShop(e.target.value)} placeholder="e.g. dadus" />
        </div>
        <div>
          <label className="stat-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="demo password: demo"
          />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary" disabled={busy} type="submit">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
