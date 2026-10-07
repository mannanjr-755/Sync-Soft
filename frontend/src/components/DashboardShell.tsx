import { auth, signOut } from "@/lib/auth";
import { TableRequestsPanel } from "@/components/TableRequestsPanel";
import {
  DashboardMobileNav,
  DashboardSidebar,
  type NavKey,
} from "@/components/DashboardSidebar";

export type { NavKey };

export async function DashboardShell({
  children,
  active,
  newOrderCount = 0,
  preparingCount = 0,
}: {
  children: React.ReactNode;
  active: NavKey;
  newOrderCount?: number;
  preparingCount?: number;
}) {
  const session = await auth();
  const restaurantName = session?.user.restaurantName || "Sync";
  void newOrderCount;
  void preparingCount;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <DashboardSidebar active={active} restaurantName={restaurantName} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-elevated)]/80">
          <div className="flex min-w-0 items-center gap-2 lg:invisible lg:w-0 lg:overflow-hidden">
            <img
              src="/logo.png"
              alt="Sync"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-lg border border-[var(--gold)]/30 object-contain"
            />
            <span className="truncate text-sm font-semibold tracking-tight text-[var(--gold)]">
              {restaurantName}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <TableRequestsPanel className="shrink-0" />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition hover:border-[var(--gold)]/40 hover:text-[var(--gold)]"
              >
                Log out
              </button>
            </form>
          </div>
        </header>

        <DashboardMobileNav active={active} />

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
