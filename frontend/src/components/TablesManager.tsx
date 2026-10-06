"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "@/components/ToastProvider";

type TableRow = {
  id: string;
  tableNumber: number;
  uniqueCode: string;
  active: boolean;
};

const CUSTOMER_MENU_URL = "https://sync-digital-menu.vercel.app";

export function TablesManager() {
  const [tables, setTables] = useState<TableRow[]>([]);
  const [slug, setSlug] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [origin, setOrigin] = useState(CUSTOMER_MENU_URL);

  const load = useCallback(async () => {
    const res = await fetch("/api/dashboard/tables");
    const data = await res.json();
    setTables(data.tables ?? []);
    setSlug(data.slug ?? "");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
      // NFC/QR must open the Digital Menu app directly (not the CRM host).
      setOrigin(CUSTOMER_MENU_URL);
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function createTable(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/dashboard/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableNumber: Number(tableNumber) }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not create table.");
      return;
    }
    toast.success(`Table ${data.table.tableNumber} created. URL: ${data.url}`);
    setTableNumber("");
    load();
  }

  function tableUrl(n: number) {
    return `${origin}/r/${slug}/t/${n}`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Tables</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Each table has a URL for NFC cards and QR codes. Linked to the Sync digital menu.
          </p>
        </div>
        <a
          href={CUSTOMER_MENU_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--gold-bright)]"
        >
          Open Sync Digital Menu
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <form onSubmit={createTable} className="mt-6 flex flex-wrap gap-2">
        <input
          type="number"
          min={1}
          required
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          placeholder="Table number"
          className="input-theme w-40 rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--gold)]"
        />
        <button
          type="submit"
          className="rounded-xl bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--gold-bright)]"
        >
          Create table
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow)]">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Table</th>
              <th className="px-4 py-3 font-medium">Customer URL (NFC / QR)</th>
              <th className="px-4 py-3 font-medium">Code</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => (
              <tr key={t.id} className="border-b border-[var(--border)]">
                <td className="px-4 py-3 font-medium text-[var(--text)]">{t.tableNumber}</td>
                <td className="px-4 py-3">
                  <a
                    href={tableUrl(t.tableNumber)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--gold-bright)] underline-offset-2 hover:underline"
                  >
                    {tableUrl(t.tableNumber)}
                  </a>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{t.uniqueCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
