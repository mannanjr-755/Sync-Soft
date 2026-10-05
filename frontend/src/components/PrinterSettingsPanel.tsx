"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ToastProvider";
import { isDesktopApp, listDesktopPrinters, printHtmlOnDesktop } from "@/lib/desktopBridge";
import {
  buildTestReceiptHtml,
  invalidatePrinterConfigCache,
  openMockPrintPreview,
  setReceiptPaperWidth,
  type ReceiptPaperWidth,
} from "@/lib/printReceipt";
import {
  DEFAULT_PRINTER_SETTING,
  PRINTER_CONNECTIONS,
  PRINTER_ROLES,
  defaultColumnsForPaper,
  isPhysicalPrinterName,
  type PrinterSettingData,
  validatePrinterSetting,
} from "@/lib/printerSettings";

const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--gold)]";

const labelClass = "mb-1.5 block text-sm font-medium text-[var(--text)]";

export function PrinterSettingsPanel() {
  const [form, setForm] = useState<PrinterSettingData>({ ...DEFAULT_PRINTER_SETTING });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [printers, setPrinters] = useState<{ name: string; displayName: string; isDefault: boolean }[]>(
    []
  );
  const [printerWarning, setPrinterWarning] = useState<string | null>(null);
  const [desktop] = useState(() =>
    typeof window !== "undefined" ? isDesktopApp() : false
  );

  const refreshPrinters = useCallback(async (preserveDevice?: string | null) => {
    setRefreshing(true);
    setPrinterWarning(null);
    try {
      if (!isDesktopApp()) {
        setPrinters([]);
        setPrinterWarning(
          "Windows printer detection requires the DelhiDarbar CRM desktop app. Mock printer still works in the browser."
        );
        return;
      }
      const list = await listDesktopPrinters();
      const physical = list.filter((p) => isPhysicalPrinterName(p.name));
      setPrinters(physical);
      if (physical.length === 0) {
        setPrinterWarning("No Windows printers detected. Connect a USB printer and refresh.");
        return;
      }
      if (preserveDevice && !physical.some((p) => p.name === preserveDevice)) {
        setPrinterWarning(
          `Saved printer "${preserveDevice}" was not found. Select an available printer and save again.`
        );
      }
    } catch (err) {
      setPrinters([]);
      setPrinterWarning(
        err instanceof Error ? err.message : "Could not refresh printers."
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/dashboard/printer-settings?role=RECEIPT", {
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          toast.error(data.error || "Could not load printer settings.");
          return;
        }
        const setting = { ...DEFAULT_PRINTER_SETTING, ...(data.setting || {}) };
        setForm(setting);
        if (setting.paperWidth === 58 || setting.paperWidth === 80) {
          setReceiptPaperWidth(setting.paperWidth);
        }
        await refreshPrinters(setting.deviceName);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshPrinters]);

  function updateField<K extends keyof PrinterSettingData>(key: K, value: PrinterSettingData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "paperWidth") {
        const pw = value as ReceiptPaperWidth;
        const expectedPrev = defaultColumnsForPaper(prev.paperWidth);
        if (prev.printColumns === expectedPrev) {
          next.printColumns = defaultColumnsForPaper(pw);
        }
      }
      return next;
    });
  }

  async function onRoleChange(role: PrinterSettingData["role"]) {
    updateField("role", role);
    try {
      const res = await fetch(`/api/dashboard/printer-settings?role=${encodeURIComponent(role)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.setting?.id) {
        setForm({ ...DEFAULT_PRINTER_SETTING, ...data.setting });
        await refreshPrinters(data.setting.deviceName);
      } else {
        setForm((prev) => ({
          ...prev,
          role,
          id: undefined,
          printColumns: defaultColumnsForPaper(prev.paperWidth),
        }));
      }
    } catch {
      /* keep local form */
    }
  }

  async function onSave() {
    const validated = validatePrinterSetting(form);
    if (!validated.ok) {
      toast.error(validated.error);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/printer-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.data),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save printer.");
        return;
      }
      setForm({ ...DEFAULT_PRINTER_SETTING, ...data.setting });
      setReceiptPaperWidth(validated.data.paperWidth);
      invalidatePrinterConfigCache();
      toast.success("Printer settings saved.");
    } catch {
      toast.error("Could not save printer settings.");
    } finally {
      setSaving(false);
    }
  }

  async function onTestPrint() {
    const validated = validatePrinterSetting(form);
    if (!validated.ok) {
      toast.error(validated.error);
      return;
    }
    setTesting(true);
    try {
      const html = buildTestReceiptHtml({
        printerName: validated.data.name,
        role:
          PRINTER_ROLES.find((r) => r.value === validated.data.role)?.label ||
          validated.data.role,
        paperWidth: validated.data.paperWidth,
        printColumns: validated.data.printColumns,
        deviceName: validated.data.deviceName,
        mockPrinter: validated.data.mockPrinter,
      });

      if (validated.data.mockPrinter) {
        openMockPrintPreview(html, "Mock test print");
        toast.info("Mock test print opened — nothing sent to a physical printer.");
        return;
      }

      if (!validated.data.deviceName) {
        toast.error("Select an installed printer first.");
        return;
      }

      if (isDesktopApp()) {
        await printHtmlOnDesktop({
          html,
          deviceName: validated.data.deviceName,
          copies: validated.data.copies,
          silent: true,
        });
        toast.success("Test print sent to printer.");
        return;
      }

      openMockPrintPreview(html, "Browser test print");
      toast.info(
        "Desktop app not detected. Opened a preview — use DelhiDarbar CRM desktop for silent USB printing."
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test print failed.");
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-[var(--text-muted)]">Loading printer settings…</p>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--gold-bright)]">Printer Settings</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Configure thermal receipt printers for this restaurant.
            {desktop ? " Desktop bridge connected." : " Browser mode — use desktop app for USB printers."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshPrinters(form.deviceName)}
          disabled={refreshing}
          className="rounded-xl border border-[var(--gold)]/50 bg-transparent px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--gold-bright)] transition hover:bg-[var(--gold)]/10 disabled:opacity-60"
        >
          {refreshing ? "Refreshing…" : "Refresh printers"}
        </button>
      </div>

      {printerWarning && (
        <p className="rounded-xl border border-[var(--orange)]/40 bg-[var(--orange)]/10 px-3 py-2 text-xs text-[var(--orange)]">
          {printerWarning}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-1">
          <span className={labelClass}>Printer name</span>
          <input
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Counter receipt printer"
            className={inputClass}
          />
        </label>

        <label className="block text-sm">
          <span className={labelClass}>Role</span>
          <select
            value={form.role}
            onChange={(e) => void onRoleChange(e.target.value as PrinterSettingData["role"])}
            className={inputClass}
          >
            {PRINTER_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className={labelClass}>Connection</span>
          <select
            value={form.connection}
            onChange={(e) =>
              updateField("connection", e.target.value as PrinterSettingData["connection"])
            }
            className={inputClass}
          >
            {PRINTER_CONNECTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className={labelClass}>Paper width</span>
          <select
            value={form.paperWidth}
            onChange={(e) =>
              updateField("paperWidth", Number(e.target.value) as ReceiptPaperWidth)
            }
            className={inputClass}
          >
            <option value={58}>58mm</option>
            <option value={80}>80mm</option>
          </select>
        </label>

        <label className="block text-sm sm:col-span-2">
          <span className={labelClass}>Installed printer</span>
          <select
            value={form.deviceName || ""}
            onChange={(e) => updateField("deviceName", e.target.value || null)}
            className={inputClass}
          >
            <option value="">
              {printers.length === 0 ? "No printer detected" : "Select a printer…"}
            </option>
            {form.deviceName &&
              !printers.some((p) => p.name === form.deviceName) && (
                <option value={form.deviceName}>
                  {form.deviceName} (saved — not currently detected)
                </option>
              )}
            {printers.map((p) => (
              <option key={p.name} value={p.name}>
                {p.displayName || p.name}
                {p.isDefault ? " (default)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className={labelClass}>Print columns</span>
          <input
            type="number"
            min={16}
            max={64}
            step={1}
            value={form.printColumns}
            onChange={(e) => {
              const n = e.target.value.replace(/[^\d]/g, "");
              updateField("printColumns", n === "" ? 0 : Number(n));
            }}
            className={inputClass}
          />
        </label>

        <label className="block text-sm">
          <span className={labelClass}>Copies</span>
          <input
            type="number"
            min={1}
            max={10}
            step={1}
            value={form.copies}
            onChange={(e) => {
              const n = e.target.value.replace(/[^\d]/g, "");
              updateField("copies", n === "" ? 0 : Number(n));
            }}
            className={inputClass}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--text)]">
          <input
            type="checkbox"
            checked={form.autoPrint}
            onChange={(e) => updateField("autoPrint", e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)] accent-[var(--gold)]"
          />
          Auto print after order
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--text)]">
          <input
            type="checkbox"
            checked={form.mockPrinter}
            onChange={(e) => updateField("mockPrinter", e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)] accent-[var(--gold)]"
          />
          Mock printer
        </label>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving || testing}
          className="rounded-xl bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#101820] transition hover:brightness-110 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Printer"}
        </button>
        <button
          type="button"
          onClick={() => void onTestPrint()}
          disabled={saving || testing}
          className="rounded-xl border border-[var(--gold)]/60 bg-transparent px-5 py-2.5 text-sm font-semibold text-[var(--gold-bright)] transition hover:bg-[var(--gold)]/10 disabled:opacity-60"
        >
          {testing ? "Testing…" : "Test Print"}
        </button>
      </div>
    </section>
  );
}
