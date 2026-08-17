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

function getBookingStatusLabel(status: BookingItem["status"]) {
  if (status === "scheduled") return "Agendado";
  if (status === "closed") return "Cerrado";
  return "Cancelado";
}

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
  const PAGE_SIZE = 10;
  const [items, setItems] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

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
        setPage(1);
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

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handleDelete(id: string) {
    const response = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      setError(getErrorMessage(payload, "No pudimos eliminar el turno"));
      return;
    }

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
                {paginatedItems.map((item) => (
                  <tr className="border-b border-slate-100" key={item.id}>
                  <td className="px-4 py-4 font-semibold text-slate-900">{item.fieldName}</td>
                  <td className="px-4 py-4 text-slate-700">{formatDateTime(item.startsAt)} - {formatDateTime(item.endsAt)}</td>
                  <td className="px-4 py-4 text-slate-700">{item.clientName ?? item.teamName ?? "Sin asignar"}</td>
                  <td className="px-4 py-4 text-slate-700">{item.clientPhone ?? "-"}</td>
                  <td className="px-4 py-4 text-slate-700">{getBookingStatusLabel(item.status)}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Link className="rounded-xl border border-slate-200 px-3 py-2 text-sm" href={`/admin/bookings/${item.id}/edit`}>
                        Editar
                      </Link>
                      <button className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600" onClick={() => void handleDelete(item.id)} type="button">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Mostrando {(currentPage - 1) * PAGE_SIZE + 1} a {Math.min(currentPage * PAGE_SIZE, items.length)} de {items.length} turnos
            </p>

            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-slate-200 px-3 py-2 disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                type="button"
              >
                ←
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  className={`rounded-xl px-3 py-2 ${pageNumber === currentPage ? "bg-[#0c7d69] font-semibold text-white" : "border border-slate-200 text-slate-700"}`}
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  type="button"
                >
                  {pageNumber}
                </button>
              ))}

              <button
                className="rounded-xl border border-slate-200 px-3 py-2 disabled:opacity-50"
                disabled={currentPage === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                type="button"
              >
                →
              </button>
            </div>
          </div>
        ) : null}
      </section>
    );
}
