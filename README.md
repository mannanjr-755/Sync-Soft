# Sync — Restaurant Kitchen Dashboard

Staff dashboard for the **Sync** brand. Customer home + digital menu live in a
separate project; this app is the kitchen/staff side and talks to the same
PostgreSQL database so menu orders land on the dashboard.

## Stack

- **Next.js 16** (App Router) — UI + API routes, no separate backend
- **Auth.js v5** — credentials login with JWT sessions
- **Prisma 6** + **Neon PostgreSQL**
- **Tailwind CSS v4**

## Run locally

```bash
npm install
cp frontend/.env.example frontend/.env      # set DATABASE_URL
npm run db:push
npm run db:ensure-admin                      # safe upsert of admin@sync.com
npm run dev                                 # http://localhost:3001
```

## Admin login

| Email            | Password  |
| ---------------- | --------- |
| `admin@sync.com` | `sync@123` |

Production: **https://synccoffee-soft.vercel.app**

Digital menu / Tables: **https://sync-digital-menu.vercel.app**

## Environment

`frontend/.env` holds `DATABASE_URL` so both the Prisma CLI and Next.js resolve
the same value. Keep secrets in `.env` / `.env.local` (never commit them).

| Variable              | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `DATABASE_URL`        | Neon PostgreSQL connection string                     |
| `AUTH_SECRET`         | Session JWT signing secret (`npx auth secret`)        |
| `AUTH_TRUST_HOST`     | Trust `X-Forwarded-Host` behind Vercel                |
| `REPORTS_PIN`         | PIN guarding the Reports page                         |
| `NEXT_PUBLIC_SITE_URL`| Deployed Digital Menu URL                              |
| `BLOB_READ_WRITE_TOKEN`| Vercel Blob store for menu image uploads             |

On Vercel these are set in the project's Environment Variables (Production,
Preview and Development). Do **not** set `AUTH_URL` to a localhost value — on
Vercel, `AUTH_TRUST_HOST` lets Auth.js derive the origin from the request, and
a wrong `AUTH_URL` sends every login redirect to that host instead.

## Notes

- `DATABASE_URL` omits `channel_binding=require` — Prisma's Postgres connector
  does not implement channel binding and fails with `P1001`.
- `connect_timeout` / `pool_timeout` are raised above Prisma's 10s defaults
  because the TLS handshake through the Neon pooler regularly exceeds it.
- Prefer `npm run db:ensure-admin` over `db:seed` on production data.
  `prisma/seed.ts` starts with `deleteMany` on every table.

## Deployment

Vercel project `synccoffee-soft` deploys from the **repository root** (the
npm-workspace monorepo). Root `vercel.json` runs the workspace build and points
Vercel at `frontend/.next`; root `.vercelignore` keeps `node_modules`, `.next`,
`desktop/` and all `.env*` files out of the upload.

```bash
vercel link --project synccoffee-soft --yes
vercel --prod --yes
```

## Desktop

`desktop/` packages the dashboard as a Windows Electron app.
`npm run icons` in `desktop/` regenerates the Windows icons from `frontend/public/logo.png`.
