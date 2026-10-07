"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleDot,
  Clock3,
  Copy,
  ExternalLink,
  LayoutGrid,
  Plus,
  Search,
  Table2,
  Users,
} from "lucide-react";
import { toast } from "@/components/ToastProvider";
import { formatMoney, STATUS_LABELS, type OrderStatus } from "@/lib/utils";

type TableRow = {
  id: string;
  tableNumber: number;
  uniqueCode: string;
  active: boolean;
};

type OpenOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  total: number;
  table: { tableNumber: number };
};

type FloorStatus = "AVAILABLE" | "OCCUPIED" | "INACTIVE";

const CUSTOMER_MENU_URL = "https://sync-digital-menu.vercel.app";
const OPEN_STATUSES = new Set(["NEW", "ACCEPTED", "PREPARING", "READY"]);

function statusMeta(status: FloorStatus) {
  switch (status) {
    case "OCCUPIED":
      return {
        label: "Occupied",
        badge: "bg-[#c2410c]/10 text-[#c2410c] border-[#c2410c]/20",
        ring: "border-[#c2410c]/25 hover:border-[#c2410c]/40",
        icon: CircleDot,
        iconTone: "bg-[#c2410c]/10 text-[#c2410c]",
      };
    case "INACTIVE":
      return {
        label: "Inactive",
        badge: "bg-[var(--text-dim)]/15 text-[var(--text-muted)] border-[var(--border)]",
        ring: "border-[var(--border)] hover:border-[var(--border-strong)] opacity-80",
        icon: Clock3,
        iconTone: "bg-[var(--bg-soft)] text-[var(--text-dim)]",
      };
    default:
      return {
        label: "Available",
        badge: "bg-[#15803d]/10 text-[#15803d] border-[#15803d]/20",
        ring: "border-[#15803d]/20 hover:border-[#15803d]/35",
        icon: CheckCircle2,
        iconTone: "bg-[#15803d]/10 text-[#15803d]",
      };
  }
}

export function TablesManager() {
  const [tables, setTables] = useState<TableRow[]>([]);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [slug, setSlug] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [origin, setOrigin] = useState(CUSTOMER_MENU_URL);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | FloorStatus>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [tablesRes, ordersRes] = await Promise.all([
        fetch("/api/dashboard/tables", { cache: "no-store" }),
        fetch("/api/dashboard/orders", { cache: "no-store" }),
      ]);
      if (tablesRes.ok) {
        const data = await tablesRes.json();
        setTables(data.tables ?? []);
        setSlug(data.slug ?? "");
      }
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        const orders = (data.orders ?? []) as OpenOrder[];
        setOpenOrders(orders.filter((o) => OPEN_STATUSES.has(o.status)));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
      setOrigin(CUSTOMER_MENU_URL);
    }, 0);
    const interval = setInterval(load, 8000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [load]);

  const ordersByTable = useMemo(() => {
    const map = new Map<number, OpenOrder>();
    for (const order of openOrders) {
      const n = order.table?.tableNumber;
      if (typeof n !== "number") continue;
      const existing = map.get(n);
      if (!existing) {
        map.set(n, order);
        continue;
      }
      // Keep the first open order as the display order; sum amounts if multiple.
      map.set(n, { ...existing, total: existing.total + order.total });
    }
    return map;
  }, [openOrders]);

  const floorTables = useMemo(() => {
    return tables.map((t) => {
      const order = ordersByTable.get(t.tableNumber);
      const status: FloorStatus = !t.active ? "INACTIVE" : order ? "OCCUPIED" : "AVAILABLE";
      return { ...t, status, order };
    });
  }, [tables, ordersByTable]);

  const stats = useMemo(() => {
    const total = floorTables.length;
    const available = floorTables.filter((t) => t.status === "AVAILABLE").length;
    const occupied = floorTables.filter((t) => t.status === "OCCUPIED").length;
    // Reserved is not modeled in the current schema — always 0 from real data.
    const reserved = 0;
    return { total, available, occupied, reserved };
  }, [floorTables]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return floorTables.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(t.tableNumber).includes(q) ||
        t.uniqueCode.toLowerCase().includes(q) ||
        (t.order?.customerName ?? "").toLowerCase().includes(q) ||
        (t.order?.orderNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [floorTables, search, statusFilter]);

  const selected = floorTables.find((t) => t.id === selectedId) ?? null;

  async function createTable(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
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
      toast.success(`Table ${data.table.tableNumber} created.`);
      setTableNumber("");
      load();
    } finally {
      setCreating(false);
    }
  }

  function tableUrl(n: number) {
    return `${origin}/r/${slug}/t/${n}`;
  }

  async function copyUrl(n: number) {
    const url = tableUrl(n);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Table URL copied.");
    } catch {
      toast.error("Could not copy URL.");
    }
  }

  const summaryCards = [
    {
      label: "Total Tables",
      value: stats.total,
      icon: LayoutGrid,
      tone: "text-[var(--gold)] bg-[var(--gold)]/10",
    },
    {
      label: "Available",
      value: stats.available,
      icon: CheckCircle2,
      tone: "text-[#15803d] bg-[#15803d]/10",
    },
    {
      label: "Occupied",
      value: stats.occupied,
      icon: Users,
      tone: "text-[#c2410c] bg-[#c2410c]/10",
    },
    {
      label: "Reserved",
      value: stats.reserved,
      icon: Clock3,
      tone: "text-[#5b21b6] bg-[#5b21b6]/10",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-[1.75rem]">
            Tables
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
            Manage floor tables, NFC/QR menu links, and live occupancy from open orders.
          </p>
        </div>
        <a
          href={CUSTOMER_MENU_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-[var(--gold)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--gold-bright)]"
        >
          Open Sync Digital Menu
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-[var(--shadow)] sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-dim)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tables, codes, guests…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-[var(--text-dim)] focus:border-[var(--gold)] focus:bg-[var(--bg-card)] focus:ring-2 focus:ring-[var(--gold)]/15"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { key: "ALL" as const, label: "All" },
                { key: "AVAILABLE" as const, label: "Available" },
                { key: "OCCUPIED" as const, label: "Occupied" },
                { key: "INACTIVE" as const, label: "Inactive" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === f.key
                    ? "bg-[var(--gold)] text-white"
                    : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--gold)]/30 hover:text-[var(--text)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={createTable} className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
          <input
            type="number"
            min={1}
            required
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="New table number"
            className="w-40 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/15"
          />
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--gold)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--gold-bright)] disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {creating ? "Creating…" : "Add table"}
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)]">{card.label}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text)]">
                    {loading ? "—" : card.value}
                  </p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floor layout */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow)] sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text)]">Floor layout</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Occupancy is based on live open kitchen orders
            </p>
          </div>
          <span className="rounded-full bg-[var(--bg-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)]">
            {filtered.length} shown
          </span>
        </div>

        {loading && (
          <p className="py-12 text-center text-sm text-[var(--text-dim)]">Loading tables…</p>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-14 text-center">
            <Table2 className="mx-auto h-8 w-8 text-[var(--text-dim)]" />
            <p className="mt-3 text-sm font-medium text-[var(--text)]">No tables match this view</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Create a table or clear your search/filter.
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((t) => {
            const meta = statusMeta(t.status);
            const Icon = meta.icon;
            const isSelected = selectedId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id === selectedId ? null : t.id)}
                className={`group rounded-2xl border bg-[var(--bg-elevated)] p-4 text-left shadow-[var(--shadow)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${meta.ring} ${
                  isSelected ? "ring-2 ring-[var(--gold)]/35" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${meta.iconTone}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-lg font-semibold tracking-tight text-[var(--text)]">
                        Table {t.tableNumber}
                      </p>
                      <p className="text-[11px] text-[var(--text-dim)]">Floor · NFC ready</p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-3 text-xs">
                  {t.order ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--text-muted)]">Guest</span>
                        <span className="truncate font-medium text-[var(--text)]">{t.order.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--text-muted)]">Order</span>
                        <span className="font-medium text-[var(--text)]">{t.order.orderNumber}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--text-muted)]">Status</span>
                        <span className="font-medium text-[var(--text)]">
                          {STATUS_LABELS[t.order.status as OrderStatus] ?? t.order.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--text-muted)]">Amount</span>
                        <span className="font-semibold text-[var(--gold)]">{formatMoney(t.order.total)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-[var(--text-muted)]">
                      {t.active ? "Ready for guests — no open order" : "Table currently inactive"}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[10px] text-[var(--text-dim)]">{t.uniqueCode}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--gold)] opacity-0 transition group-hover:opacity-100">
                    Details
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected table detail / actions */}
      {selected && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow)] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
                Selected table
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text)]">
                Table {selected.tableNumber}
              </h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {statusMeta(selected.status).label}
                {selected.order
                  ? ` · ${selected.order.orderNumber} · ${formatMoney(selected.order.total)}`
                  : " · No open order"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              Close
            </button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">
                Customer menu URL
              </p>
              <a
                href={tableUrl(selected.tableNumber)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block break-all text-sm text-[var(--gold)] hover:underline"
              >
                {tableUrl(selected.tableNumber)}
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyUrl(selected.tableNumber)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm font-medium text-[var(--text)] transition hover:border-[var(--gold)]/35"
              >
                <Copy className="h-4 w-4" />
                Copy URL
              </button>
              <a
                href={tableUrl(selected.tableNumber)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--gold)] px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--gold-bright)]"
              >
                <ExternalLink className="h-4 w-4" />
                Open menu
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
