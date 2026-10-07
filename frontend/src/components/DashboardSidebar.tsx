"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Table2,
  UtensilsCrossed,
  Tags,
  Users,
  BarChart3,
  Package,
  Footprints,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavKey =
  | "orders"
  | "tables"
  | "menu"
  | "walking-customer"
  | "categories"
  | "customers"
  | "staff"
  | "reports"
  | "inventory"
  | "payments"
  | "profile"
  | "orders-link"
  | "kitchen";

const STORAGE_KEY = "crm-sidebar-collapsed";

const nav: { href: string; label: string; icon: LucideIcon; key: string }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "orders" },
  {
    href: "/dashboard/walking-customer",
    label: "Walking Customer",
    icon: Footprints,
    key: "walking-customer",
  },
  { href: "/dashboard/tables", label: "Tables", icon: Table2, key: "tables" },
  { href: "/dashboard/menu", label: "Menu", icon: UtensilsCrossed, key: "menu" },
  { href: "/dashboard/categories", label: "Categories", icon: Tags, key: "categories" },
  { href: "/dashboard/customers", label: "Customers", icon: Users, key: "customers" },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3, key: "reports" },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package, key: "inventory" },
  { href: "/dashboard/profile", label: "Settings", icon: Settings, key: "profile" },
];

function isNavActive(active: NavKey, key: string) {
  if (active === "orders" || active === "orders-link" || active === "kitchen") {
    return key === "orders";
  }
  return key === active;
}

export function DashboardSidebar({
  active,
  restaurantName,
}: {
  active: NavKey;
  restaurantName: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
      } catch {
        /* ignore */
      }
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-sidebar)] lg:flex ${
        ready ? "transition-[width] duration-200 ease-out" : ""
      } ${collapsed ? "w-[72px]" : "w-[248px]"}`}
    >
      <div
        className={`flex items-center border-b border-[var(--border)] py-4 ${
          collapsed ? "flex-col gap-2 px-2" : "gap-3 px-3"
        }`}
      >
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[var(--gold)]/20 shadow-[var(--shadow)]">
          <Image
            src="/logo.png"
            alt="Sync"
            width={40}
            height={40}
            className="h-full w-full object-contain"
            priority
          />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-tight tracking-tight text-[var(--text)]">
              {restaurantName}
            </p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--text-dim)]">
              Sync Dashboard
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] transition hover:border-[var(--gold)]/40 hover:text-[var(--gold-bright)]"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav
        className={`flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden py-3 ${
          collapsed ? "px-1.5" : "px-2.5"
        }`}
      >
        {nav.map((item) => {
          const isActive = isNavActive(active, item.key);
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`relative flex items-center rounded-xl text-[13px] font-medium transition ${
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
              } ${
                isActive
                  ? "bg-[var(--gold)]/10 text-[var(--gold)] shadow-[inset_3px_0_0_0_var(--gold)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
              {!collapsed && <span className="truncate leading-none">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Compact promo visual — sits above the fold edge, does not replace Settings */}
      <div className={`shrink-0 border-t border-[var(--border)] ${collapsed ? "p-1.5" : "p-3"}`}>
        {collapsed ? (
          <div className="relative mx-auto h-10 w-10 overflow-hidden rounded-xl border border-[var(--border)] shadow-[var(--shadow)]">
            <Image
              src="/images/sidebar-promo.jpg"
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow)]">
            <div className="relative h-[88px] w-full">
              <Image
                src="/images/sidebar-promo.jpg"
                alt="Sync workspace"
                fill
                sizes="220px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--gold-dim)]/85 via-[var(--gold)]/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <p className="text-[11px] font-semibold tracking-tight text-white">Sync Ops</p>
                <p className="text-[10px] leading-snug text-white/80">
                  Live kitchen &amp; table flow
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export function DashboardMobileNav({ active }: { active: NavKey }) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-[var(--border)] px-3 py-2 lg:hidden">
      {nav.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
            isNavActive(active, item.key)
              ? "bg-[var(--gold)]/10 text-[var(--gold)]"
              : "text-[var(--text-muted)]"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
