# DelhiDarbar — Windows Desktop

Desktop wrapper for the existing production DelhiDarbar dashboard. Does **not** change app code, APIs, or database.

## Production URL

`https://delhidarbarsoft.vercel.app`

## Build installer (Windows)

```bash
cd desktop
npm install
npm run icons
npm run dist
```

Output:

- `desktop/dist/DelhiDarbar-Setup-1.0.0.exe` — NSIS installer (Start Menu + Desktop shortcuts)

## Run without installing

```bash
cd desktop
npm start
```

## Notes

- Uses the live DelhiDarbar deployment (same login, dashboard, printing, reports, notifications, Excel export, etc.).
- App icon is the DelhiDarbar brand mark (not a React/default framework icon).
- Installer embeds the same icon for `.exe`, Desktop shortcut, Start Menu, and window chrome.
- Optional override: set `CRM_DESKTOP_URL` before launch to point at another environment.
- Internet is required; the desktop shell loads the production CRM (backend/API/database unchanged).
