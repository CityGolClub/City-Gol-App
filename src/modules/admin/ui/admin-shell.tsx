"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { LogoutButton } from "@/components/logout-button";
import logoCitygol from "@/imgs/Logo-Citygol.png";
import canjesIcon from "@/imgs/canjes.png";
import configuracionIcon from "@/imgs/configuracion.png";
import equiposIcon from "@/imgs/equipos.png";
import exportarIcon from "@/imgs/exportar.png";
import canchasIcon from "@/imgs/canchas.png";
import turnosIcon from "@/imgs/turnos.png";
import usuariosIcon from "@/imgs/usuarios.png";

const items = [
  { href: "/admin/bookings", label: "Turnos", icon: turnosIcon },
  { href: "/admin/teams", label: "Equipos", icon: equiposIcon },
  { href: "/admin/users", label: "Usuarios", icon: usuariosIcon },
  { href: "/admin/fields", label: "Canchas", icon: canchasIcon },
  { href: "/admin/settings", label: "Configuración", icon: configuracionIcon },
  { href: "/admin/redemptions", label: "Canjes", icon: canjesIcon },
  { href: "/admin/export", label: "Exportación", icon: exportarIcon },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const elements = [sidebarRef.current, contentRef.current].filter(Boolean) as HTMLElement[];
    const cleanups = elements.map((element) => {
      let timeoutId: number | null = null;

      const handleScroll = () => {
        element.classList.add("is-scrolling");

        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }

        timeoutId = window.setTimeout(() => {
          element.classList.remove("is-scrolling");
        }, 700);
      };

      element.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
        element.removeEventListener("scroll", handleScroll);
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
      };
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

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
    <main className="h-screen overflow-hidden bg-[#f4f7ff] text-slate-900">
      <div className="grid h-screen lg:grid-cols-[260px_1fr]">
        <aside ref={sidebarRef} className="smart-scroll flex min-h-0 flex-col overflow-y-auto border-b border-slate-200 bg-[#eef3ff] p-5 lg:h-screen lg:border-b-0 lg:border-r lg:p-6">
          <div className="flex items-center gap-3">
            <Image alt="Logo City Gol" className="h-15 w-15 rounded-xl object-contain" priority src={logoCitygol} />
            <div>
              <p className="text-[1.7rem] font-bold text-cyan-700">City Gol</p>
              <p className="mt-1 text-sm text-slate-500">Panel Admin</p>
            </div>
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
                  <Image alt="" aria-hidden className={`h-5 w-5 shrink-0 object-contain ${active ? "opacity-100" : "opacity-70"}`} src={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-10">
            <div className="border-t border-slate-200 pt-6">
              <Link
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0c7d69] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                href="/admin/bookings/new"
              >
                <span className="text-base text-white">＋</span>
                <span className="text-white">Nuevo turno</span>
              </Link>

              <div className="mt-4">
                <LogoutButton className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-3 text-center text-sm font-semibold text-red-600 transition hover:bg-white hover:text-red-700" />
              </div>
            </div>
          </div>
        </aside>

        <section ref={contentRef} className="smart-scroll min-h-0 overflow-y-auto p-4 sm:p-6 lg:h-screen lg:p-8">{children}</section>
      </div>
    </main>
  );
}
