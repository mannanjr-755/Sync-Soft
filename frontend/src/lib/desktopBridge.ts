/**
 * Bridge to the Sync CRM Electron desktop app.
 * Supports both `syncDesktop` and legacy `delhiDarbarDesktop` bridge names.
 */

export type DesktopPrinter = {
  name: string;
  displayName: string;
  description?: string;
  status?: number;
  isDefault: boolean;
};

export type DesktopPrintResult = {
  success: boolean;
  error?: string;
};

type DesktopBridge = {
  isDesktop: boolean;
  listPrinters: () => Promise<DesktopPrinter[]>;
  printHtml: (opts: {
    html: string;
    deviceName?: string;
    silent?: boolean;
    copies?: number;
  }) => Promise<DesktopPrintResult>;
};

declare global {
  interface Window {
    syncDesktop?: DesktopBridge;
    delhiDarbarDesktop?: DesktopBridge;
  }
}

function getBridge(): DesktopBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return window.syncDesktop ?? window.delhiDarbarDesktop;
}

export function isDesktopApp(): boolean {
  return Boolean(getBridge()?.isDesktop);
}

export async function listDesktopPrinters(): Promise<DesktopPrinter[]> {
  const bridge = getBridge();
  if (!isDesktopApp() || !bridge) {
    throw new Error("Open Sync CRM desktop app to detect Windows installed printers.");
  }
  return bridge.listPrinters();
}

export async function printHtmlOnDesktop(opts: {
  html: string;
  deviceName?: string;
  silent?: boolean;
  copies?: number;
}): Promise<DesktopPrintResult> {
  const bridge = getBridge();
  if (!isDesktopApp() || !bridge) {
    throw new Error("Open Sync CRM desktop app to print to a Windows USB printer.");
  }
  return bridge.printHtml(opts);
}
