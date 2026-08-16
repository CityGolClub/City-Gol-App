"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";

const items = [
  { href: "/admin/bookings", label: "Turnos", icon: "◫" },
  { href: "/admin/bookings/new", label: "Nuevo turno", icon: "+" },
  { href: "/admin/teams", label: "Equipos", icon: "◎" },
  { href: "/admin/users", label: "Usuarios", icon: "◌" },
  { href: "/admin/fields", label: "Canchas", icon: "▣" },
  { href: "/admin/settings", label: "Configuración", icon: "◍" },
  { href: "/admin/redemptions", label: "Canjes", icon: "◈" },
  { href: "/admin/export", label: "Exportación", icon: "⇩" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(itemHref: string) {
    if (itemHref === "/admin/bookings") {
      return pathname === "/admin/bookings" || pathname.startsWith("/admin/bookings/") && !pathname.startsWith("/admin/bookings/new");
    }

    if (itemHref === "/admin/bookings/new") {
      return pathname === "/admin/bookings/new";
    }

    return pathname === itemHref;
  }

  return (
    <main className="min-h-screen bg-[#f4f7ff] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col border-b border-slate-200 bg-[#eef3ff] p-5 lg:min-h-screen lg:border-b-0 lg:border-r lg:p-6">
          <div>
            <p className="text-3xl font-bold text-cyan-700">City Gol</p>
            <p className="mt-1 text-sm text-slate-500">Panel Admin</p>
          </div>

          <nav className="mt-8 grid gap-2">
            {items.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-white text-cyan-700 shadow-sm" : "text-slate-700 hover:bg-white/70"}`}
                  href={item.href}
                  key={item.href}
                >
                  <span className={`text-base ${active ? "text-cyan-700" : "text-slate-500"}`}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-10">
            <div className="border-t border-slate-200 pt-6">
              <Link
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0c7d69] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                href="/admin/bookings/new"
              >
                <span className="text-base">＋</span>
                Nuevo turno
              </Link>

              <div className="mt-4">
                <LogoutButton className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 transition hover:text-red-700" />
              </div>
            </div>
          </div>
        </aside>

        <section className="p-4 sm:p-6 lg:p-8">{children}</section>
      </div>
    </main>
  );
}
