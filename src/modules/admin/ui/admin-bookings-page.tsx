"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

type BookingItem = {
  id: string;
  fieldId: string;
  fieldName: string;
  teamId: string | null;
  teamName: string | null;
  clientName: string | null;
  clientPhone: string | null;
  startsAt: string;
  endsAt: string;
  validFrom: string;
  validUntil: string;
  qrToken: string;
  checkinLimitSnapshot: number;
  status: "scheduled" | "cancelled" | "closed";
  createdAt: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function AdminBookingsPage() {
  const [items, setItems] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useMemo(
    () => async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/bookings", { cache: "no-store" });
        const payload = await readJsonResponse(response);

        if (!response.ok) {
          setError(getErrorMessage(payload, "No pudimos cargar los turnos"));
          setItems([]);
          return;
        }

        setItems(Array.isArray(payload?.items) ? payload.items : []);
      } catch {
        setError("No pudimos cargar los turnos");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  async function handleDelete(id: string) {
    await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    await loadBookings();
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Turnos</h1>
          <p className="mt-3 text-base text-slate-600">Listado de reservas registradas para las canchas del complejo.</p>
        </div>

        <Link className="inline-flex items-center gap-2 rounded-full bg-[#0c7d69] px-6 py-4 text-sm font-semibold text-white shadow-sm" href="/admin/bookings/new">
          <span className="text-lg">＋</span>
          Nuevo turno
        </Link>
      </div>

      {loading ? <p className="text-sm text-slate-600">Cargando turnos...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f2f5ff] text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="rounded-l-2xl px-4 py-4">Cancha</th>
                <th className="px-4 py-4">Horario</th>
                <th className="px-4 py-4">Nombre / equipo</th>
                <th className="px-4 py-4">Telefono</th>
                <th className="px-4 py-4">Estado</th>
                <th className="rounded-r-2xl px-4 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-b border-slate-100" key={item.id}>
                  <td className="px-4 py-4 font-semibold text-slate-900">{item.fieldName}</td>
                  <td className="px-4 py-4 text-slate-700">{formatDateTime(item.startsAt)} - {formatDateTime(item.endsAt)}</td>
                  <td className="px-4 py-4 text-slate-700">{item.clientName ?? item.teamName ?? "Sin asignar"}</td>
                  <td className="px-4 py-4 text-slate-700">{item.clientPhone ?? "-"}</td>
                  <td className="px-4 py-4 text-slate-700">{item.status}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Link className="rounded-xl border border-slate-200 px-3 py-2 text-sm" href={`/admin/bookings/${item.id}/edit`}>
                        Editar
                      </Link>
                      <button className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600" onClick={() => void handleDelete(item.id)} type="button">
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
