# Sync — Windows Desktop

Desktop wrapper for the production Sync dashboard. Does **not** change app code, APIs, or database.

Loads:

`https://synccoffee-soft.vercel.app`

## Build

```bash
cd desktop
npm install
npm run icons
npm run dist
```

Output:

- `desktop/dist/Sync-CRM-Setup-1.0.0.exe` — NSIS installer (Start Menu + Desktop shortcuts)

## Notes

- Uses the live Sync deployment (same login, dashboard, printing, reports, notifications, Excel export, etc.).
- App icon is the Sync brand mark (not a React/default framework icon).
