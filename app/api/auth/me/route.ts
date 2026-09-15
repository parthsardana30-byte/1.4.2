import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });
  const claims = await verifyToken(token);
  if (!claims) { const response = NextResponse.json({ authenticated: false }, { status: 401 }); response.cookies.delete("auth_token"); return response; }
  return NextResponse.json({ authenticated: true, user: { id: claims.sub, email: claims.email, name: claims.name, role: claims.role }, claims });
}
