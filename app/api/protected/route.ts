import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const claims = token ? await verifyToken(token) : null;
  if (!claims) return NextResponse.json({ error: "A valid bearer session is required." }, { status: 401 });
  return NextResponse.json({ message: "Protected data received.", authorizedAs: claims.email, role: claims.role, requestId: crypto.randomUUID() });
}
