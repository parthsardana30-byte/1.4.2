import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/jwt";
import type { Role } from "@/lib/rbac";

const demoUsers: Record<string, { id: string; email: string; password: string; name: string; role: Role }> = {
  "admin@accessgrid.dev": { id: "usr_admin", email: "admin@accessgrid.dev", password: "Admin123!", name: "Maya Chen", role: "admin" },
  "editor@accessgrid.dev": { id: "usr_editor", email: "editor@accessgrid.dev", password: "Editor123!", name: "Jordan Lee", role: "editor" },
  "viewer@accessgrid.dev": { id: "usr_viewer", email: "viewer@accessgrid.dev", password: "Viewer123!", name: "Sam Rivera", role: "viewer" },
};

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; remember?: boolean };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send valid JSON credentials." }, { status: 400 }); }
  await new Promise((resolve) => setTimeout(resolve, 350));
  const demoUser = demoUsers[body.email?.trim().toLowerCase() ?? ""];
  if (!demoUser || body.password !== demoUser.password) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  const lifetime = body.remember ? 60 * 60 * 24 * 7 : 60 * 15;
  try {
    const { password: _password, ...safeUser } = demoUser;
    const token = await createToken(safeUser, lifetime);
    const response = NextResponse.json({ authenticated: true, user: safeUser });
    response.cookies.set("auth_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: lifetime });
    return response;
  } catch { return NextResponse.json({ error: "Authentication is not configured on this server." }, { status: 503 }); }
}
