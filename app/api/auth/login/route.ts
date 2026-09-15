import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/jwt";

const demoUser = { id: "usr_1001", email: "learner@example.com", name: "Alex Morgan", role: "learner" };

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; remember?: boolean };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send valid JSON credentials." }, { status: 400 }); }
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (body.email?.trim().toLowerCase() !== demoUser.email || body.password !== "SecurePass123!") return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  const lifetime = body.remember ? 60 * 60 * 24 * 7 : 60 * 15;
  try {
    const token = await createToken(demoUser, lifetime);
    const response = NextResponse.json({ authenticated: true, user: demoUser });
    response.cookies.set("auth_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: lifetime });
    return response;
  } catch { return NextResponse.json({ error: "Authentication is not configured on this server." }, { status: 503 }); }
}
