# TokenLab — JWT authentication demo

TokenLab is a React/Next.js teaching project that demonstrates credential validation, JWT creation, secure browser storage, claim verification, protected API access, expiry, and logout.

## Run locally

```bash
npm run dev
```

Open `http://localhost:5173` and use:

- Email: `learner@example.com`
- Password: `SecurePass123!`

Local development uses a scoped fallback signing secret. For deployment, set `JWT_SECRET` to a random value of at least 32 characters; see `.env.example`.

## Security choices

- Tokens are signed with HMAC-SHA256 using the Web Crypto API.
- The JWT is stored in an `HttpOnly`, `SameSite=Strict` cookie instead of `localStorage`, preventing page scripts from reading it and reducing XSS exposure.
- Protected endpoints validate the signature, algorithm, issuer, audience, issue time, and expiry.
- Passwords are never included in JWT claims.
- Logout invalidates the browser cookie.

A production system should additionally use database-backed users with hashed passwords, rate limiting, short-lived access tokens, refresh-token rotation, and server-side revocation for high-risk sessions.

## API routes

- `POST /api/auth/login` — validates the mock account and issues the JWT cookie.
- `GET /api/auth/me` — verifies the cookie and returns safe user/claim data.
- `POST /api/auth/logout` — expires the cookie.
- `GET /api/protected` — returns data only after successful token verification.
