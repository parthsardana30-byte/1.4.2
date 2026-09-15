# AccessGrid — RBAC Console

AccessGrid is a React/Next.js teaching project for role-based access control. It demonstrates JWT authentication, protected React Router views, centralized role permissions, permission-aware UI, and server-side authorization with clear `401` and `403` responses.

## Version

`1.3.2`

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and select a demo role. Credentials are filled automatically:

- Administrator: `admin@accessgrid.dev` / `Admin123!`
- Content editor: `editor@accessgrid.dev` / `Editor123!`
- Read-only viewer: `viewer@accessgrid.dev` / `Viewer123!`

## RBAC model

- **Admin** — full access, including team and role management.
- **Editor** — view, create, edit, and publish content.
- **Viewer** — read-only access to content and analytics.

Roles and permissions are defined in `lib/rbac.ts`. Client-side route guards improve the experience, while the protected API repeats authorization checks on the server so hidden UI is never treated as the security boundary.

## Security notes

- JWTs are signed with HMAC-SHA256 using the Web Crypto API.
- Tokens are stored in `HttpOnly`, `SameSite=Strict` cookies.
- Protected endpoints validate the signature, algorithm, issuer, audience, issue time, expiry, role, and requested permission.
- Demo passwords are for teaching only. Production systems should use hashed credentials, persistent users, rate limiting, token rotation, and revocation.
