"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";
import { formatArgentinaDateTime, formatArgentinaDateTimeLocalInput } from "@/lib/datetime";

type BookingItem = {
  id: string;
  fieldId: string;
  fieldName: string;
  teamId: string | null;
  teamName: string | null;
  startsAt: string;
  endsAt: string;
  validFrom: string;
  validUntil: string;
  qrToken: string;
  checkinLimitSnapshot: number;
  status: "scheduled" | "cancelled" | "closed";
  createdAt: string;
};

type Option = { id: string; name: string };

type BookingFormState = {
  id?: string;
  fieldId: string;
  teamId: string;
  startsAt: string;
  status: "scheduled" | "cancelled" | "closed";
};

const emptyBooking: BookingFormState = {
  fieldId: "",
  teamId: "",
  startsAt: "",
  status: "scheduled",
};

export function AdminBookingsPage() {
  const [items, setItems] = useState<BookingItem[]>([]);
  const [fields, setFields] = useState<Option[]>([]);
  const [teams, setTeams] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<BookingFormState | null>(null);
  const [saving, setSaving] = useState(false);

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
        setFields(Array.isArray(payload?.fields) ? payload.fields : []);
        setTeams(Array.isArray(payload?.teams) ? payload.teams : []);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setMessage(null);

    const method = selected.id ? "PATCH" : "POST";
    const url = selected.id ? `/api/admin/bookings/${selected.id}` : "/api/admin/bookings";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selected),
    });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      setMessage(getErrorMessage(payload, "No pudimos guardar el turno"));
      setSaving(false);
      return;
    }

    setMessage("Turno guardado");
    setSaving(false);
    await loadBookings();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    await loadBookings();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div>
          <h1 className="text-4xl font-bold">Turnos</h1>
          <p className="mt-3 text-base text-slate-600">Gestiona los bookings reales del sistema sin superponer canchas.</p>
        </div>

        <button className="rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white" onClick={() => setSelected({ ...emptyBooking })} type="button">
          Nuevo turno
        </button>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
        {loading ? <p className="text-sm text-slate-600">Cargando turnos...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !error ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f2f5ff] text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="rounded-l-2xl px-4 py-4">Cancha</th>
                  <th className="px-4 py-4">Horario</th>
                  <th className="px-4 py-4">Equipo</th>
                  <th className="px-4 py-4">Estado</th>
                  <th className="px-4 py-4">Cupo</th>
                  <th className="rounded-r-2xl px-4 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className="border-b border-slate-100" key={item.id}>
                    <td className="px-4 py-4 font-semibold text-slate-900">{item.fieldName}</td>
                    <td className="px-4 py-4 text-slate-700">{formatArgentinaDateTime(item.startsAt)} - {formatArgentinaDateTime(item.endsAt)}</td>
                    <td className="px-4 py-4 text-slate-700">{item.teamName ?? "Sin asignar"}</td>
                    <td className="px-4 py-4 text-slate-700">{item.status}</td>
                    <td className="px-4 py-4 text-slate-700">{item.checkinLimitSnapshot}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          onClick={() => setSelected({
                            id: item.id,
                            fieldId: item.fieldId,
                            teamId: item.teamId ?? "",
                            startsAt: formatArgentinaDateTimeLocalInput(item.startsAt),
                            status: item.status,
                          })}
                          type="button"
                        >
                          Editar
                        </button>
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

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-bold">{selected.id ? "Editar turno" : "Nuevo turno"}</h2>
              <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" onClick={() => setSelected(null)} type="button">
                Cerrar
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <select className="rounded-2xl border border-slate-200 px-4 py-3" value={selected.fieldId} onChange={(event) => setSelected({ ...selected, fieldId: event.target.value })}>
                <option value="">Selecciona una cancha</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>{field.name}</option>
                ))}
              </select>

              <select className="rounded-2xl border border-slate-200 px-4 py-3" value={selected.teamId} onChange={(event) => setSelected({ ...selected, teamId: event.target.value })}>
                <option value="">Sin equipo</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>

              <input className="rounded-2xl border border-slate-200 px-4 py-3" type="datetime-local" value={selected.startsAt} onChange={(event) => setSelected({ ...selected, startsAt: event.target.value })} />

              {selected.id ? (
                <select className="rounded-2xl border border-slate-200 px-4 py-3" value={selected.status} onChange={(event) => setSelected({ ...selected, status: event.target.value as BookingFormState["status"] })}>
                  <option value="scheduled">scheduled</option>
                  <option value="closed">closed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              ) : null}

              {message ? <p className="text-sm text-slate-600">{message}</p> : null}

              <button className="rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">
                {saving ? "Guardando..." : "Guardar turno"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
