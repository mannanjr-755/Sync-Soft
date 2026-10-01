# DelhiDarbar — Restaurant Kitchen Dashboard

Staff dashboard for the **DelhiDarbar** brand. Customer home + digital menu live in a
separate project (`restaurantorder`); this app is the kitchen/staff side and
talks to the same PostgreSQL database so menu orders land on the dashboard.

## Stack

- **Next.js 16** (App Router) — UI + API routes, no separate backend
- **Auth.js v5** — credentials login with JWT sessions
- **Prisma 6** + **Neon PostgreSQL**
- **Tailwind CSS v4**

## Run locally

```bash
npm install
cp frontend/.env.example frontend/.env      # set DATABASE_URL
npm run dev                                 # http://localhost:3001
```

Database setup:

```bash
npm run db:push     # sync schema
npm run db:seed     # demo restaurant, admin user, tables, menu
```

## Admin login

| Email              | Password |
| ------------------ | -------- |
| `admin@delhidarbar.com`     | `123456` |

Production: **https://delhidarbarsoft.vercel.app**

## Environment

`frontend/.env` holds `DATABASE_URL` so both the Prisma CLI and Next.js resolve
the same value. `frontend/.env.local` holds the rest.

| Variable              | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `DATABASE_URL`        | Neon PostgreSQL connection string                     |
| `AUTH_SECRET`         | Session JWT signing secret (`npx auth secret`)        |
| `AUTH_TRUST_HOST`     | Trust `X-Forwarded-Host` behind Vercel                |
| `REPORTS_PIN`         | PIN guarding the Reports page                         |
| `NEXT_PUBLIC_SITE_URL`| Deployed Digital Menu URL                              |
| `BLOB_READ_WRITE_TOKEN`| Vercel Blob store for menu image uploads             |
| `CUSTOMER_PUBLIC_DIR` | Local-only: extra directory to mirror uploads into    |

On Vercel these are set in the project's Environment Variables (Production,
Preview and Development). Do **not** set `AUTH_URL` to a localhost value — on
Vercel, `AUTH_TRUST_HOST` lets Auth.js derive the origin from the request, and
a wrong `AUTH_URL` sends every login redirect to that host instead.

## Notes

- `DATABASE_URL` omits `channel_binding=require` — Prisma's Postgres connector
  does not implement channel binding and fails with `P1001`.
- `connect_timeout` / `pool_timeout` are raised above Prisma's 10s defaults
  because the TLS handshake through the Neon pooler regularly exceeds it.
- `src/lib/prisma.ts` retries transient connection errors
  (`P1001`, `P1002`, `P1008`, `P1017`, `P2024`, `P2028`) and
  `src/instrumentation.ts` opens the pool at boot, so serverless cold starts do
  not fail the first request.

## Deployment

Vercel project `delhidarbarsoft` deploys from the **repository root** (the
npm-workspace monorepo). Root `vercel.json` runs the workspace build and points
Vercel at `frontend/.next`; root `.vercelignore` keeps `node_modules`, `.next`,
`desktop/` and all `.env*` files out of the upload.

```bash
vercel link --project delhidarbarsoft --yes
vercel --prod --yes
```

`prisma db push` / `db:seed` are **never** run by the build. `prisma/seed.ts`
starts with `deleteMany` on every table, so running it against the production
database would wipe the live menu, orders and staff accounts.

Menu image uploads go to Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set (the
deployed app) and fall back to writing into `public/uploads/menu` for `next dev`
and the Electron build, whose filesystem is writable. The stored `imageUrl` is
an absolute Blob URL, because the Digital Menu is a separate app on a separate
origin.

## Desktop

`desktop/` packages the dashboard as a Windows Electron app.
`npm run icons` in `desktop/` regenerates the Windows icons from `frontend/public/logo.png`.
