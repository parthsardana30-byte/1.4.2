"use client";

import { ArrowRight, Braces, Check, CheckCircle2, ChevronRight, Eye, EyeOff, Fingerprint, KeyRound, LoaderCircle, LockKeyhole, LogOut, RefreshCw, Send, ShieldCheck, Terminal, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type Claims = { sub: string; email: string; name: string; role: string; iat: number; exp: number; iss: string; aud: string; jti: string };
type Session = { authenticated: boolean; user?: { id: string; email: string; name: string; role: string }; claims?: Claims };

const flow = [
  ["01", "Credentials submitted", "The browser sends credentials over an encrypted connection."],
  ["02", "Identity verified", "The server checks the account before creating any token."],
  ["03", "JWT signed", "An HMAC signature protects the header and claims from tampering."],
  ["04", "Cookie secured", "The token is stored in an HttpOnly, SameSite cookie."],
  ["05", "Request authorized", "Protected routes verify the signature, issuer, audience, and expiry."],
];

const time = (seconds: number) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(seconds * 1000));

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("learner@example.com");
  const [password, setPassword] = useState("SecurePass123!");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [apiResult, setApiResult] = useState("");
  const [activeStep, setActiveStep] = useState(0);

  const refreshSession = async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      setSession(await response.json() as Session);
    } catch { setSession({ authenticated: false }); }
  };

  useEffect(() => { void refreshSession(); }, []);

  const login = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setApiResult(""); setActiveStep(1);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password, remember }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Login failed.");
      setActiveStep(5); await refreshSession();
    } catch (caught) { setActiveStep(0); setError(caught instanceof Error ? caught.message : "Login failed."); }
    finally { setBusy(false); }
  };

  const logout = async () => {
    setBusy(true); await fetch("/api/auth/logout", { method: "POST" }); setSession({ authenticated: false }); setApiResult(""); setActiveStep(0); setBusy(false);
  };

  const callProtectedRoute = async () => {
    setBusy(true); const response = await fetch("/api/protected", { cache: "no-store" }); const data = await response.json();
    setApiResult(`${response.status} ${response.statusText}\n${JSON.stringify(data, null, 2)}`); setBusy(false);
  };

  const loading = session === null;
  const authenticated = session?.authenticated === true;

  return <main className="auth-lab">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Token Lab home"><span className="brand-mark"><ShieldCheck size={20} strokeWidth={2.2} /></span><span>Token<span>Lab</span></span></a>
      <div className="environment"><span /> Educational sandbox</div>
      <a className="source-link" href="#how-it-works">How it works <ArrowRight size={15} /></a>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="kicker"><LockKeyhole size={15} /> JWT authentication lab</p>
        <h1>Sign in once.<br /><em>Stay verified.</em></h1>
        <p className="intro">A hands-on demonstration of stateless authentication—from credential validation to signed claims and protected API access.</p>
        <div className="trust-list"><span><Check size={15} /> HMAC-SHA256 signature</span><span><Check size={15} /> HttpOnly cookie storage</span><span><Check size={15} /> Expiring, server-verified sessions</span></div>
      </div>

      <section className="auth-card" aria-labelledby="auth-title">
        {loading ? <div className="card-loading"><LoaderCircle className="spin" size={28} /><span>Checking your session…</span></div>
        : authenticated && session.user && session.claims ? <div className="session-view">
          <div className="success-icon"><CheckCircle2 size={25} /></div><p className="card-eyebrow">Session active</p><h2 id="auth-title">Welcome, {session.user.name.split(" ")[0]}</h2>
          <p className="card-copy">Your signed token was verified by the server. The browser never exposes it to page scripts.</p>
          <div className="identity-row"><span><UserRound size={18} /></span><div><strong>{session.user.name}</strong><small>{session.user.email}</small></div><b>{session.user.role}</b></div>
          <div className="session-actions"><button className="primary-button" type="button" onClick={callProtectedRoute} disabled={busy}><Send size={16} /> Test protected API</button><button className="icon-button" type="button" onClick={() => void refreshSession()} aria-label="Refresh session"><RefreshCw size={18} /></button></div>
          {apiResult && <pre className="api-result" aria-live="polite">{apiResult}</pre>}
          <button className="logout-button" type="button" onClick={logout} disabled={busy}><LogOut size={15} /> End session</button>
        </div> : <form onSubmit={login}>
          <p className="card-eyebrow">Secure access</p><h2 id="auth-title">Welcome back</h2><p className="card-copy">Use the demo credentials below to issue a signed token.</p>
          <label><span>Email address</span><div className="input-shell"><UserRound size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></div></label>
          <label><span>Password</span><div className="input-shell"><KeyRound size={17} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          <label className="remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Keep me signed in for 7 days</span></label>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button login-button" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : <Fingerprint size={18} />}{busy ? "Signing token…" : "Sign in securely"}<ChevronRight size={18} /></button>
          <div className="demo-note"><Terminal size={16} /><span><strong>Demo account</strong>learner@example.com · SecurePass123!</span></div>
        </form>}
      </section>
    </section>

    <section className="flow-section" id="how-it-works">
      <div className="section-heading"><div><p className="kicker">Request lifecycle</p><h2>What happens after “Sign in”</h2></div><p>Each stage has a single responsibility. The server remains the source of truth.</p></div>
      <div className="flow-grid">{flow.map(([number, title, description], index) => <article className={activeStep > index ? "flow-card complete" : "flow-card"} key={number}><div className="flow-number">{activeStep > index ? <Check size={17} /> : number}</div><div><h3>{title}</h3><p>{description}</p></div>{index < flow.length - 1 && <ChevronRight className="flow-arrow" size={18} />}</article>)}</div>
    </section>

    <section className="token-section">
      <div className="token-copy"><p className="kicker"><Braces size={15} /> Anatomy of a JWT</p><h2>Three parts. One verifiable identity.</h2><p>The encoded data is readable, not encrypted. Trust comes from the signature, so secrets and passwords never belong in the payload.</p><div className="legend"><span><i className="header-dot" /> Header</span><span><i className="payload-dot" /> Payload</span><span><i className="signature-dot" /> Signature</span></div></div>
      <div className="token-console"><div className="console-bar"><span /><span /><span /><b>verified-token.jwt</b></div><div className="token-string" aria-label="Example JSON Web Token"><span>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9</span>.<span>eyJzdWIiOiJ1c3JfMTAwMSIsInJvbGUiOiJsZWFybmVyIn0</span>.<span>m7Yw8rAZQvN0N4bK2saPl9KJ8nVw</span></div><dl><div><dt>Algorithm</dt><dd>HS256</dd></div><div><dt>Issuer</dt><dd>token-lab</dd></div><div><dt>Audience</dt><dd>token-lab-client</dd></div><div><dt>Lifetime</dt><dd>{remember ? "7 days" : "15 minutes"}</dd></div></dl></div>
    </section>

    {authenticated && session.claims && <section className="claims-section"><div className="section-heading"><div><p className="kicker">Decoded safely</p><h2>Current token claims</h2></div><p>Returned only after server-side signature validation.</p></div><div className="claims-grid"><div><span>Subject</span><strong>{session.claims.sub}</strong></div><div><span>Role</span><strong>{session.claims.role}</strong></div><div><span>Issued at</span><strong>{time(session.claims.iat)}</strong></div><div><span>Expires</span><strong>{time(session.claims.exp)}</strong></div></div></section>}
    <footer><span><ShieldCheck size={16} /> TokenLab</span><p>Built for learning. Mock credentials only—never reuse them in production.</p></footer>
  </main>;
}
