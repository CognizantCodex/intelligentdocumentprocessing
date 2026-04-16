"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth-provider";

const navigation = [
  { href: "/", label: "Upload" },
  { href: "/library", label: "Library" },
  { href: "/processing", label: "Processing" },
  { href: "/review-queue", label: "Review Queue" },
  { href: "/metrics", label: "Metrics" },
  { href: "/login", label: "Login" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { credentials, logout } = useAuth();

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-5">
      <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="panel-dark flex flex-col p-6">
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white/10 ring-1 ring-white/10" />
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Enterprise Platform</div>
                  <div className="mt-1 text-lg font-semibold text-white">Enterprise IDP Studio</div>
                </div>
              </div>
              <h1 className="mt-5 text-xl font-semibold leading-snug text-white">
                AI-grounded document workflows for enterprise operations
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Upload, classify, extract, validate, route, review, and export business documents with evidence on every field.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Operational Guardrail</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">AI extraction may be imperfect; verify before use.</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Modes</div>
                <div className="mt-2 text-sm text-white">Upload, review, export</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Controls</div>
                <div className="mt-2 text-sm text-white">PII, validation, routing</div>
              </div>
            </div>
            <nav className="space-y-2 border-t border-white/10 pt-4">
              {navigation.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition ${
                      active ? "bg-white text-slate-950 shadow-sm" : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    <span>{item.label}</span>
                    {active ? <span className="text-xs font-semibold uppercase tracking-[0.18em]">Live</span> : null}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Session</div>
              <div className="mt-2 font-medium text-white">{credentials ? credentials.username : "Guest mode"}</div>
              <div className="mt-1 leading-6">Role-ready auth via backend Basic Auth.</div>
              {credentials ? (
                <button className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900" onClick={logout}>
                  Log out
                </button>
              ) : null}
            </div>
          </div>
        </aside>
        <main className="space-y-5">
          <div className="panel flex items-center justify-between px-6 py-4">
            <div>
              <div className="eyebrow">Operational Workspace</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">Document Intelligence Console</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-700">
                Mock API Connected
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold tracking-wide text-slate-600">
                Institutional Demo Mode
              </div>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
