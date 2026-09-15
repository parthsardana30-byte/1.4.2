import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { can, isPermission } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const claims = token ? await verifyToken(token) : null;
  if (!claims) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: { permission?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a permission to evaluate." }, { status: 400 }); }
  if (!body.permission || !isPermission(body.permission)) return NextResponse.json({ error: "Unknown permission." }, { status: 400 });
  if (!can(claims.role, body.permission)) return NextResponse.json({ error: "Permission denied.", role: claims.role, required: body.permission }, { status: 403 });
  return NextResponse.json({ message: "Permission granted.", role: claims.role, permission: body.permission, requestId: crypto.randomUUID() });
}
