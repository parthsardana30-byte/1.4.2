import type { Role } from "@/lib/rbac";

const encoder = new TextEncoder();
const issuer = "token-lab";
const audience = "token-lab-client";

export type JwtClaims = { sub: string; email: string; name: string; role: Role; iat: number; exp: number; iss: string; aud: string; jti: string };

function base64UrlEncode(value: Uint8Array | string): string {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function getSecret(): string {
  const configured = process.env.JWT_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV !== "production") return "token-lab-local-development-secret-change-me";
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}

async function signingKey() {
  return crypto.subtle.importKey("raw", encoder.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createToken(user: { id: string; email: string; name: string; role: Role }, lifetimeSeconds: number): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload: JwtClaims = { sub: user.id, email: user.email, name: user.name, role: user.role, iat: now, exp: now + lifetimeSeconds, iss: issuer, aud: audience, jti: crypto.randomUUID() };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const content = `${header}.${encodedPayload}`;
  const signature = await crypto.subtle.sign("HMAC", await signingKey(), encoder.encode(content));
  return `${content}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifyToken(token: string): Promise<JwtClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const [header, payload, signature] = parts;
    const parsedHeader = JSON.parse(new TextDecoder().decode(base64UrlDecode(header))) as { alg?: string; typ?: string };
    if (parsedHeader.alg !== "HS256" || parsedHeader.typ !== "JWT") return null;
    const signatureBytes = Uint8Array.from(base64UrlDecode(signature));
    const valid = await crypto.subtle.verify("HMAC", await signingKey(), signatureBytes.buffer, encoder.encode(`${header}.${payload}`));
    if (!valid) return null;
    const claims = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload))) as JwtClaims;
    const now = Math.floor(Date.now() / 1000);
    if (claims.iss !== issuer || claims.aud !== audience || !claims.sub || claims.exp <= now || claims.iat > now + 30) return null;
    return claims;
  } catch { return null; }
}
