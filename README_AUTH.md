Auth & env setup

This project uses NextAuth (Credentials provider) with Prisma as the adapter. To get role-based login working locally, follow these steps:

1. Set required environment variables in your `.env` file (example):

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=some-strong-random-secret
DATABASE_URL=postgresql://user:pass@host:5432/dbname
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me

Use a secure random string for `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32`).

2. Seed an admin user (if not present)

This repo contains `prisma/seed.ts` which upserts an admin user using `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars. Run:

# push schema (if needed)
prisma db push

# run seed (node)
node prisma/seed.ts

3. Start the app

npm run dev

Open http://localhost:3000/login and sign in using the admin credentials.

4. Notes on RBAC

- Client-side role checks use NextAuth session (session.user.role) via `useSession()`.
- Important: API routes should enforce server-side RBAC. Use `src/lib/auth.ts` helpers:
  - `getServerSessionOrNull()` to obtain the session server-side.
  - `requireRole(session, ["ADMIN"])` to enforce the required roles.

5. Next steps

- Remove the localStorage fallback from `useCurrentUser` once all pages use `useSession`.
- Optionally, add server-side middleware to enforce authentication globally for `/api` routes.
