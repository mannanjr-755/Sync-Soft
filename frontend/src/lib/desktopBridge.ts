/**
 * Bridge to the DelhiDarbar CRM Electron desktop app.
 * Remote Vercel pages cannot list USB printers; the desktop preload exposes IPC.
 */

export type DesktopPrinterInfo = {
  name: string;
  displayName: string;
  status: number;
  isDefault: boolean;
};

type DesktopBridge = {
  isDesktop: true;
  listPrinters: () => Promise<DesktopPrinterInfo[]>;
  printHtml: (opts: {
    html: string;
    deviceName: string;
    copies?: number;
    silent?: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
};

declare global {
  interface Window {
    delhiDarbarDesktop?: DesktopBridge;
  }
}

export function isDesktopApp(): boolean {
  return typeof window !== "undefined" && Boolean(window.delhiDarbarDesktop?.isDesktop);
}

export async function listDesktopPrinters(): Promise<DesktopPrinterInfo[]> {
  if (!isDesktopApp() || !window.delhiDarbarDesktop) {
    throw new Error(
      "Open DelhiDarbar CRM desktop app to detect Windows installed printers."
    );
  }
  return window.delhiDarbarDesktop.listPrinters();
}

export async function printHtmlOnDesktop(opts: {
  html: string;
  deviceName: string;
  copies?: number;
  silent?: boolean;
}): Promise<void> {
  if (!isDesktopApp() || !window.delhiDarbarDesktop) {
    throw new Error(
      "Open DelhiDarbar CRM desktop app to print to a Windows USB printer."
    );
  }
  const result = await window.delhiDarbarDesktop.printHtml(opts);
  if (!result.ok) {
    throw new Error(result.error || "Print failed.");
  }
}
