"use client";

import {
  BarChart3, Check, ChevronRight, CircleAlert, FilePenLine, FileText, KeyRound,
  LayoutDashboard, LockKeyhole, LogOut, Menu, Plus, Search, ShieldCheck, Sparkles,
  UserCog, Users, X,
} from "lucide-react";
import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import { HashRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { can, Permission, roleLabels, rolePermissions, Role } from "@/lib/rbac";

type User = { id: string; email: string; name: string; role: Role };
type Session = { authenticated: boolean; user?: User };

const demos: Record<Role, { email: string; password: string; initials: string; summary: string }> = {
  admin: { email: "admin@accessgrid.dev", password: "Admin123!", initials: "MC", summary: "Full access, including user administration" },
  editor: { email: "editor@accessgrid.dev", password: "Editor123!", initials: "JL", summary: "Create, edit, and publish content" },
  viewer: { email: "viewer@accessgrid.dev", password: "Viewer123!", initials: "SR", summary: "Read-only access to content and analytics" },
};

const navigation: { to: string; label: string; icon: typeof LayoutDashboard; permission: Permission }[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, permission: "dashboard.view" },
  { to: "/content", label: "Content", icon: FileText, permission: "content.view" },
  { to: "/users", label: "Team access", icon: Users, permission: "users.view" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, permission: "analytics.view" },
];

function initials(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2); }

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [role, setRole] = useState<Role>("admin");
  const [email, setEmail] = useState(demos.admin.email);
  const [password, setPassword] = useState(demos.admin.password);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const chooseRole = (nextRole: Role) => {
    setRole(nextRole); setEmail(demos[nextRole].email); setPassword(demos[nextRole].password); setError("");
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json() as { error?: string; user?: User };
      if (!response.ok || !data.user) throw new Error(data.error || "Sign in failed.");
      onLogin(data.user); navigate("/dashboard", { replace: true });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Sign in failed."); }
    finally { setBusy(false); }
  };

  return <main className="login-page">
    <section className="login-story">
      <a className="wordmark light" href="#/login"><span><ShieldCheck size={21} /></span> AccessGrid</a>
      <div className="story-copy"><p className="eyebrow"><LockKeyhole size={15} /> RBAC learning environment</p><h1>One workspace.<br /><em>Three levels of access.</em></h1><p>Explore how roles become permissions, how protected routes respond, and why the server always makes the final authorization decision.</p></div>
      <div className="policy-preview"><div><span>AUTHORIZATION POLICY</span><Badge>ENFORCED</Badge></div><code>role → permissions → protected resource</code><div className="policy-path"><span>Identity</span><ChevronRight /><span>Role</span><ChevronRight /><span>Decision</span></div></div>
    </section>
    <section className="login-panel"><form onSubmit={submit} className="login-form"><p className="eyebrow dark">Demo access</p><h2>Choose a role to continue</h2><p className="form-intro">Each account reveals a different set of routes and actions.</p>
      <div className="role-picker" role="radiogroup" aria-label="Demo role">
        {(["admin", "editor", "viewer"] as Role[]).map((item) => <button key={item} type="button" role="radio" aria-checked={role === item} className={role === item ? "role-option active" : "role-option"} onClick={() => chooseRole(item)}><span className={`role-avatar ${item}`}>{demos[item].initials}</span><span><strong>{roleLabels[item]}</strong><small>{demos[item].summary}</small></span>{role === item && <Check size={17} />}</button>)}
      </div>
      <label className="field"><span>Email</span><div><Search size={17} /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required /></div></label>
      <label className="field"><span>Password</span><div><KeyRound size={17} /><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required /></div></label>
      {error && <p className="form-error" role="alert"><CircleAlert size={16} />{error}</p>}
      <Button className="submit-button" size="lg" disabled={busy}>{busy ? "Verifying access…" : "Enter workspace"}<ChevronRight /></Button>
      <p className="credential-note">Demo credentials are filled automatically when you select a role.</p>
    </form></section>
  </main>;
}

function ProtectedRoute({ user, permission, children }: { user: User; permission: Permission; children: ReactNode }) {
  const location = useLocation();
  if (!can(user.role, permission)) return <Navigate to="/unauthorized" replace state={{ from: location.pathname, permission }} />;
  return children;
}

function Shell({ user, onLogout }: { user: User; onLogout: () => Promise<void> }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="app-shell">
    <aside className={menuOpen ? "sidebar open" : "sidebar"}>
      <div className="sidebar-head"><a className="wordmark light" href="#/dashboard"><span><ShieldCheck size={20} /></span> AccessGrid</a><button className="close-menu" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button></div>
      <nav aria-label="Workspace"><p>Workspace</p>{navigation.filter((item) => can(user.role, item.permission)).map((item) => { const Icon = item.icon; return <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "active" : ""}><Icon />{item.label}<ChevronRight /></NavLink>; })}</nav>
      <div className="scope-card"><p>Current access scope</p><strong>{roleLabels[user.role]}</strong><span>{rolePermissions[user.role].length} of 8 permissions granted</span><div className="scope-meter"><i style={{ width: `${rolePermissions[user.role].length / 8 * 100}%` }} /></div></div>
      <button className="sidebar-user" onClick={onLogout}><Avatar><AvatarFallback>{initials(user.name)}</AvatarFallback></Avatar><span><strong>{user.name}</strong><small>{user.email}</small></span><LogOut /></button>
    </aside>
    {menuOpen && <button className="menu-scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}
    <div className="app-main"><header className="app-topbar"><button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu /></button><div><span className="status-pulse" /> Policy engine online</div><Badge variant="outline" className={`role-badge ${user.role}`}>{roleLabels[user.role]}</Badge></header>
      <Routes>
        <Route path="/dashboard" element={<ProtectedRoute user={user} permission="dashboard.view"><Dashboard user={user} /></ProtectedRoute>} />
        <Route path="/content" element={<ProtectedRoute user={user} permission="content.view"><ContentPage user={user} /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute user={user} permission="users.view"><UsersPage user={user} /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute user={user} permission="analytics.view"><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/unauthorized" element={<Unauthorized user={user} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  </div>;
}

function PageTitle({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: ReactNode }) {
  return <div className="page-title"><div><p className="eyebrow dark">{eyebrow}</p><h1>{title}</h1><p>{copy}</p></div>{action}</div>;
}

function PermissionTest({ user, permission, label }: { user: User; permission: Permission; label: string }) {
  const [result, setResult] = useState<{ status: number; message: string } | null>(null);
  const test = async () => {
    const response = await fetch("/api/protected", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ permission }) });
    const data = await response.json() as { message?: string; error?: string };
    setResult({ status: response.status, message: data.message || data.error || "No response" });
  };
  return <div className="permission-test"><div><span className={can(user.role, permission) ? "decision allow" : "decision deny"}>{can(user.role, permission) ? "ALLOW" : "DENY"}</span><strong>{label}</strong><code>{permission}</code></div><Button variant="outline" onClick={test}>Test API</Button>{result && <p className={result.status === 200 ? "test-result success" : "test-result denied"}><b>{result.status}</b> {result.message}</p>}</div>;
}

function Dashboard({ user }: { user: User }) {
  const granted = rolePermissions[user.role].length;
  return <main className="page"><PageTitle eyebrow="Access overview" title={`Good morning, ${user.name.split(" ")[0]}.`} copy="Your workspace is filtered by the permissions attached to your current role." />
    <section className="stat-grid"><Card><CardContent><span className="stat-icon teal"><ShieldCheck /></span><div><small>Permissions granted</small><strong>{granted}<i>/ 8</i></strong><p>Calculated from {roleLabels[user.role]}</p></div></CardContent></Card><Card><CardContent><span className="stat-icon amber"><KeyRound /></span><div><small>Protected routes</small><strong>{navigation.filter((item) => can(user.role, item.permission)).length}<i>/ 4</i></strong><p>Visible in your navigation</p></div></CardContent></Card><Card><CardContent><span className="stat-icon blue"><Sparkles /></span><div><small>Policy status</small><strong className="word-status">Enforced</strong><p>Server checks every action</p></div></CardContent></Card></section>
    <section className="dashboard-grid"><div className="panel matrix-panel"><div className="panel-heading"><div><h2>Permission matrix</h2><p>What each role can do across the application.</p></div><Badge variant="secondary">Live policy</Badge></div><div className="matrix"><div className="matrix-head"><span>Capability</span><span>Admin</span><span>Editor</span><span>Viewer</span></div>{(["users.manage", "content.create", "content.edit", "content.publish", "analytics.view"] as Permission[]).map((permission) => <div className="matrix-row" key={permission}><span>{permission.split(".").map((part) => part[0].toUpperCase() + part.slice(1)).join(" · ")}</span>{(["admin", "editor", "viewer"] as Role[]).map((role) => <span key={role}>{can(role, permission) ? <i className="matrix-yes"><Check /></i> : <i className="matrix-no">—</i>}</span>)}</div>)}</div></div>
      <div className="panel tests-panel"><div className="panel-heading"><div><h2>Try a decision</h2><p>Send a permission to the protected API.</p></div></div><PermissionTest user={user} permission="content.publish" label="Publish content" /><PermissionTest user={user} permission="users.manage" label="Manage users" /></div></section>
  </main>;
}

function ContentPage({ user }: { user: User }) {
  const items = [["Q3 product update", "Draft", "Maya Chen", "14 Sep 2026"], ["Editor onboarding guide", "Published", "Jordan Lee", "12 Sep 2026"], ["Security checklist", "Review", "Jordan Lee", "09 Sep 2026"]];
  return <main className="page"><PageTitle eyebrow="Content library" title="Content" copy="Browse the library. Editing controls only appear when your role permits them." action={can(user.role, "content.create") ? <Button><Plus /> New content</Button> : undefined} />
    <div className="panel table-panel"><div className="content-table"><div className="content-row table-head"><span>Document</span><span>Status</span><span>Owner</span><span>Updated</span><span>Actions</span></div>{items.map(([title, status, owner, date]) => <div className="content-row" key={title}><span><i><FileText /></i><strong>{title}</strong></span><span><Badge variant={status === "Published" ? "default" : "secondary"}>{status}</Badge></span><span>{owner}</span><span>{date}</span><span>{can(user.role, "content.edit") ? <Button variant="ghost" size="sm"><FilePenLine /> Edit</Button> : <small>View only</small>}</span></div>)}</div></div>
    <div className="permission-note"><ShieldCheck /><div><strong>UI permission check</strong><p>The “New content” and “Edit” actions render only for roles with <code>content.create</code> or <code>content.edit</code>.</p></div></div>
  </main>;
}

function UsersPage({ user }: { user: User }) {
  const people = [["Maya Chen", "admin", "Full access"], ["Jordan Lee", "editor", "Content workflow"], ["Sam Rivera", "viewer", "Read only"]] as [string, Role, string][];
  return <main className="page"><PageTitle eyebrow="Administration" title="Team access" copy="Assign roles and review the access scope for each workspace member." action={can(user.role, "users.manage") ? <Button><UserCog /> Manage roles</Button> : undefined} /><div className="team-grid">{people.map(([name, role, scope]) => <Card key={name}><CardContent><Avatar size="lg"><AvatarFallback>{initials(name)}</AvatarFallback></Avatar><div><strong>{name}</strong><span>{scope}</span></div><Badge variant="outline" className={`role-badge ${role}`}>{roleLabels[role]}</Badge></CardContent></Card>)}</div><PermissionTest user={user} permission="users.manage" label="Update a team member role" /></main>;
}

function AnalyticsPage() {
  return <main className="page"><PageTitle eyebrow="Visibility" title="Analytics" copy="A shared read-only route available to every role." /><div className="analytics-panel"><div className="analytics-copy"><Badge variant="secondary">Last 7 days</Badge><h2>1,284 authorized requests</h2><p>98.7% of requests matched an explicit permission. Denied requests are preserved in the audit trail.</p><div className="analytics-legend"><span><i /> Allowed · 1,267</span><span><i /> Denied · 17</span></div></div><div className="bar-chart" aria-label="Authorized requests over seven days">{[52, 68, 61, 78, 72, 90, 84].map((height, index) => <div key={index}><span style={{ height: `${height}%` }} /><small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small></div>)}</div></div></main>;
}

function Unauthorized({ user }: { user: User }) {
  const location = useLocation();
  const state = location.state as { permission?: Permission } | null;
  return <main className="page denied-page"><div className="denied-card"><span><LockKeyhole /></span><p className="eyebrow dark">403 · Access denied</p><h1>This route is outside your role.</h1><p><strong>{roleLabels[user.role]}</strong> does not include {state?.permission ? <code>{state.permission}</code> : "the required permission"}. Your session is valid, but the authorization policy blocked the request.</p><Button asChild><NavLink to="/dashboard">Return to overview</NavLink></Button></div></main>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const refresh = useCallback(async () => {
    try { const response = await fetch("/api/auth/me", { cache: "no-store" }); const data = await response.json() as Session; setSession(response.ok ? data : { authenticated: false }); }
    catch { setSession({ authenticated: false }); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); setSession({ authenticated: false }); };
  const authenticated = session?.authenticated === true && !!session.user;
  if (session === null) return <div className="boot-screen"><ShieldCheck /><span>Loading access policy…</span></div>;
  return <Routes><Route path="/login" element={authenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={(user) => setSession({ authenticated: true, user })} />} /><Route path="/*" element={authenticated && session.user ? <Shell user={session.user} onLogout={logout} /> : <Navigate to="/login" replace />} /></Routes>;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="boot-screen"><ShieldCheck /><span>Loading access policy…</span></div>;
  return <HashRouter><App /></HashRouter>;
}
