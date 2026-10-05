import type { ReceiptPaperWidth } from "@/lib/printReceipt";

export const PRINTER_ROLES = [
  { value: "RECEIPT", label: "Receipt / Cashier" },
  { value: "KITCHEN", label: "Kitchen" },
  { value: "BAR", label: "Bar" },
  { value: "LABEL", label: "Label" },
  { value: "OTHER", label: "Other" },
] as const;

export type PrinterRole = (typeof PRINTER_ROLES)[number]["value"];

export const PRINTER_CONNECTIONS = [{ value: "USB", label: "USB (Windows installed printer)" }] as const;

export type PrinterConnection = (typeof PRINTER_CONNECTIONS)[number]["value"];

export type PrinterSettingData = {
  id?: string;
  name: string;
  role: PrinterRole;
  connection: PrinterConnection;
  paperWidth: ReceiptPaperWidth;
  deviceName: string | null;
  printColumns: number;
  copies: number;
  autoPrint: boolean;
  mockPrinter: boolean;
};

export const DEFAULT_PRINTER_SETTING: PrinterSettingData = {
  name: "",
  role: "RECEIPT",
  connection: "USB",
  paperWidth: 80,
  deviceName: null,
  printColumns: 40,
  copies: 1,
  autoPrint: false,
  mockPrinter: false,
};

export function defaultColumnsForPaper(paperWidth: ReceiptPaperWidth): number {
  return paperWidth === 58 ? 32 : 40;
}

export function sanitizePrinterName(value: unknown): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 120);
}

export function sanitizeDeviceName(value: unknown): string | null {
  const name = String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 200);
  return name || null;
}

export function validatePrinterSetting(input: Partial<PrinterSettingData>): {
  ok: true;
  data: PrinterSettingData;
} | { ok: false; error: string } {
  const name = sanitizePrinterName(input.name);
  if (!name) return { ok: false, error: "Printer name is required." };

  const role = (PRINTER_ROLES.some((r) => r.value === input.role)
    ? input.role
    : "RECEIPT") as PrinterRole;

  const connection = (PRINTER_CONNECTIONS.some((c) => c.value === input.connection)
    ? input.connection
    : "USB") as PrinterConnection;

  const paperWidth: ReceiptPaperWidth = input.paperWidth === 58 ? 58 : 80;

  const printColumns = Math.floor(Number(input.printColumns));
  if (!Number.isFinite(printColumns)) {
    return { ok: false, error: "Print columns must be a number." };
  }
  if (printColumns < 16 || printColumns > 64) {
    return { ok: false, error: "Print columns must be between 16 and 64." };
  }

  const copies = Math.floor(Number(input.copies));
  if (!Number.isFinite(copies) || copies < 1) {
    return { ok: false, error: "Copies must be at least 1." };
  }
  if (copies > 10) {
    return { ok: false, error: "Copies cannot exceed 10." };
  }

  const deviceName = sanitizeDeviceName(input.deviceName);
  const mockPrinter = Boolean(input.mockPrinter);
  if (!mockPrinter && !deviceName) {
    return {
      ok: false,
      error: "Select an installed printer, or enable Mock printer for testing.",
    };
  }

  return {
    ok: true,
    data: {
      name,
      role,
      connection,
      paperWidth,
      deviceName,
      printColumns,
      copies,
      autoPrint: Boolean(input.autoPrint),
      mockPrinter,
    },
  };
}

/** Exclude virtual PDF printers from physical receipt selection. */
export function isPhysicalPrinterName(name: string): boolean {
  const n = name.toLowerCase();
  if (n.includes("microsoft print to pdf")) return false;
  if (n.includes("onenote")) return false;
  if (n.includes("fax")) return false;
  if (n.includes("xps document")) return false;
  return true;
}
