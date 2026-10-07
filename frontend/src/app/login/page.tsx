import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Staff login",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--bg)] px-4 py-12 text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,75,184,0.14),transparent_55%)]" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex flex-col items-center text-center">
          <BrandLogo size="hero" showWordmark />
        </Link>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow)] sm:p-8">
          <h1 className="font-display text-2xl text-[var(--text)]">Staff sign in</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Access your live orders dashboard, menu, and tables.
          </p>

          <div className="mt-6">
            <Suspense fallback={<p className="text-sm text-[var(--text-muted)]">Loading…</p>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
