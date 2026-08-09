"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";

const items = [
  { href: "/admin/users", label: "Usuarios" },
  { href: "/admin/teams", label: "Equipos" },
  { href: "/admin/fields", label: "Canchas" },
  { href: "/admin/settings", label: "Configuración" },
  { href: "/admin/bookings", label: "Turnos" },
  { href: "/admin/redemptions", label: "Canjes" },
  { href: "/admin/export", label: "Exportación" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#f4f7ff] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-slate-200 bg-[#eef3ff] p-5 lg:border-b-0 lg:border-r lg:p-6">
          <div>
            <p className="text-3xl font-bold text-cyan-700">City Gol</p>
            <p className="mt-1 text-sm text-slate-500">Athletic Vitality System</p>
          </div>

          <nav className="mt-8 grid gap-2">
            {items.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-white text-cyan-700 shadow-sm" : "text-slate-700 hover:bg-white/70"}`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 pt-4">
            <LogoutButton className="w-full rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-white" />
          </div>
        </aside>

        <section className="p-4 sm:p-6 lg:p-8">{children}</section>
      </div>
    </main>
  );
}
