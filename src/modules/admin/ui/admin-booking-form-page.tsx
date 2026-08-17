"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";
import { formatArgentinaDateTimeLocalInput } from "@/lib/datetime";

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

function getBookingStatusLabel(status: BookingItem["status"] | BookingFormState["status"]) {
  if (status === "scheduled") return "Agendado";
  if (status === "closed") return "Cerrado";
  return "Cancelado";
}

type FieldOption = {
  id: string;
  name: string;
  fieldType?: string;
};

type TeamOption = { id: string; name: string };
type UserSearchOption = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  team: { id: string; name: string } | null;
};

type BookingFormState = {
  id?: string;
  fieldId: string;
  teamId: string;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  status: "scheduled" | "cancelled" | "closed";
};

type SettingsPayload = {
  bookingDurationMinutes: number;
  graceMinutes: number;
};

const timeOptions = Array.from({ length: 32 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

function getTodayDateInput() {
  return formatArgentinaDateTimeLocalInput(new Date()).split("T")[0] ?? "";
}

function buildStartsAtValue(form: BookingFormState) {
  if (!form.date || !form.time) return "";
  return `${form.date}T${form.time}`;
}

function getFieldTypeLabel(fieldType?: string) {
  if (fieldType === "futbol8") return "FÚTBOL 8";
  return "FÚTBOL 5";
}

function createEmptyBooking(): BookingFormState {
  return {
    fieldId: "",
    teamId: "",
    clientName: "",
    clientPhone: "",
    date: getTodayDateInput(),
    time: "",
    status: "scheduled",
  };
}

export function AdminBookingFormPage({ bookingId }: { bookingId?: string }) {
  const router = useRouter();
  const [items, setItems] = useState<BookingItem[]>([]);
  const [fields, setFields] = useState<FieldOption[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [users, setUsers] = useState<UserSearchOption[]>([]);
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<BookingFormState>(createEmptyBooking());
  const [saving, setSaving] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useMemo(
    () => async () => {
      try {
        setLoading(true);
        setError(null);

        const [bookingsResponse, usersResponse] = await Promise.all([
          fetch("/api/admin/bookings", { cache: "no-store" }),
          fetch("/api/admin/users", { cache: "no-store" }),
        ]);

        const [bookingsPayload, usersPayload] = await Promise.all([readJsonResponse(bookingsResponse), readJsonResponse(usersResponse)]);

        if (!bookingsResponse.ok) {
          setError(getErrorMessage(bookingsPayload, "No pudimos cargar la configuración del turno"));
          return;
        }

        const loadedItems = Array.isArray(bookingsPayload?.items) ? bookingsPayload.items : [];
        setItems(loadedItems);
        setFields(Array.isArray(bookingsPayload?.fields) ? bookingsPayload.fields : []);
        setTeams(Array.isArray(bookingsPayload?.teams) ? bookingsPayload.teams : []);
        setSettings(bookingsPayload?.settings ?? null);

        if (usersResponse.ok) {
          setUsers(Array.isArray(usersPayload?.items) ? usersPayload.items : []);
        }

        if (bookingId) {
          const item = loadedItems.find((entry: BookingItem) => entry.id === bookingId);
          if (!item) {
            setError("No encontramos el turno a editar");
            return;
          }

          const localValue = formatArgentinaDateTimeLocalInput(item.startsAt);
          const [date, time] = localValue.split("T");
          setSelected({
            id: item.id,
            fieldId: item.fieldId,
            teamId: item.teamId ?? "",
            clientName: item.clientName ?? item.teamName ?? "",
            clientPhone: item.clientPhone ?? "",
            date: date ?? getTodayDateInput(),
            time: time ?? "",
            status: item.status,
          });
        } else {
          setSelected(createEmptyBooking());
        }
      } catch {
        setError("No pudimos cargar la configuración del turno");
      } finally {
        setLoading(false);
      }
    },
    [bookingId],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const searchResults = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    if (!normalized) {
      return { teams: teams.slice(0, 8), users: users.slice(0, 8) };
    }

    return {
      teams: teams.filter((team) => team.name.toLowerCase().includes(normalized)).slice(0, 8),
      users: users
        .filter((user) => `${user.firstName} ${user.lastName}`.toLowerCase().includes(normalized) || user.phone.toLowerCase().includes(normalized))
        .slice(0, 8),
    };
  }, [searchQuery, teams, users]);

  function handleSelectTeam(team: TeamOption) {
    setSelected((current) => ({
      ...current,
      clientName: team.name,
      teamId: team.id,
      clientPhone: "",
    }));
    setSearchOpen(false);
    setSearchQuery("");
  }

  function handleSelectUser(user: UserSearchOption) {
    setSelected((current) => ({
      ...current,
      clientName: `${user.firstName} ${user.lastName}`,
      clientPhone: user.phone,
      teamId: user.team?.id ?? current.teamId,
    }));
    setSearchOpen(false);
    setSearchQuery("");
  }

  function handleUseCustomName() {
    setSelected((current) => ({
      ...current,
      clientName: searchQuery.trim(),
      teamId: "",
      clientPhone: "",
    }));
    setSearchOpen(false);
  }

  function getFieldAvailability(fieldId: string) {
    if (!selected.date || !selected.time || !settings) {
      return { occupied: false };
    }

    const startsAt = buildStartsAtValue(selected);
    if (!startsAt) return { occupied: false };

    const start = new Date(`${startsAt}:00`);
    if (Number.isNaN(start.getTime())) return { occupied: false };

    const end = new Date(start.getTime() + settings.bookingDurationMinutes * 60 * 1000);
    const overlap = items.find((item) => {
      if (item.fieldId !== fieldId) return false;
      if (item.status === "cancelled") return false;
      if (selected.id && item.id === selected.id) return false;
      const itemStart = new Date(item.startsAt);
      const itemEnd = new Date(item.endsAt);
      return start < itemEnd && end > itemStart;
    });

    return { occupied: Boolean(overlap) };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const method = selected.id ? "PATCH" : "POST";
    const url = selected.id ? `/api/admin/bookings/${selected.id}` : "/api/admin/bookings";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fieldId: selected.fieldId,
        teamId: selected.teamId,
        clientName: selected.clientName,
        clientPhone: selected.clientPhone,
        startsAt: buildStartsAtValue(selected),
        status: selected.status,
      }),
    });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      setMessage(getErrorMessage(payload, "No pudimos guardar el turno"));
      setSaving(false);
      return;
    }

    router.push("/admin/bookings");
    router.refresh();
  }

  if (loading) {
    return (
      <section className="rounded-[26px] bg-white p-5 shadow-sm lg:p-6">
        <p className="text-sm text-slate-600">Cargando formulario...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-[26px] bg-white p-5 shadow-sm lg:p-6">
        <p className="text-sm text-red-600">{error}</p>
      </section>
    );
  }

  return (
    <section className="rounded-[26px] bg-white p-5 shadow-sm lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold lg:text-[2rem]">{bookingId ? "Editar turno" : "Nuevo turno"}</h1>
          <p className="mt-2 text-sm text-slate-600">Complete los detalles para registrar una nueva reserva de cancha.</p>
        </div>

        <Link className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm" href="/admin/bookings">
          Cerrar
        </Link>
      </div>

      <form className="mt-6 grid gap-6" onSubmit={handleSubmit}>
        <section className="rounded-[24px] bg-[#fbfdff] p-5 shadow-sm sm:p-6">
          <h3 className="text-2xl font-bold text-[#0c7d69]">Datos del Cliente</h3>
          <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Nombre o equipo</label>
              <button className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-left text-sm text-slate-900" onClick={() => setSearchOpen(true)} type="button">
                {selected.clientName || "Ej. Los Pibes FC"}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Teléfono</label>
              <input className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" placeholder="Ej. 11 1234 5678" value={selected.clientPhone} onChange={(event) => setSelected({ ...selected, clientPhone: event.target.value })} />
            </div>
          </div>
        </section>

        <section className="rounded-[24px] bg-[#fbfdff] p-5 shadow-sm sm:p-6">
          <h3 className="text-2xl font-bold text-[#0c7d69]">Fecha y Hora</h3>
          <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Fecha</label>
              <input className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" type="date" value={selected.date} onChange={(event) => setSelected({ ...selected, date: event.target.value })} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Horario</label>
              <select className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" value={selected.time} onChange={(event) => setSelected({ ...selected, time: event.target.value })}>
                <option value="">Seleccionar horario...</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] bg-[#fbfdff] p-5 shadow-sm sm:p-6">
          <h3 className="text-2xl font-bold text-[#0c7d69]">Selección de Cancha</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {fields.map((field) => {
              const availability = getFieldAvailability(field.id);
              const selectedField = selected.fieldId === field.id;

              return (
                <button
                  className={`rounded-xl border p-3.5 text-left transition ${availability.occupied ? "border-slate-200 bg-slate-100 text-slate-400" : selectedField ? "border-[#0c7d69] bg-white text-slate-900 shadow-sm" : "border-slate-200 bg-white text-slate-900"}`}
                  disabled={availability.occupied}
                  key={field.id}
                  onClick={() => setSelected({ ...selected, fieldId: field.id })}
                  type="button"
                >
                  <p className="text-lg font-bold">{field.name}</p>
                  <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{getFieldTypeLabel(field.fieldType)}</p>
                  <p className={`mt-2.5 text-[11px] font-bold uppercase tracking-[0.16em] ${availability.occupied ? "text-rose-400" : "text-emerald-600"}`}>
                    {availability.occupied ? "Ocupada" : "Disponible"}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {bookingId ? (
          <section className="rounded-[24px] bg-[#fbfdff] p-5 shadow-sm sm:p-6">
            <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Estado</label>
            <select className="mt-2.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" value={selected.status} onChange={(event) => setSelected({ ...selected, status: event.target.value as BookingFormState["status"] })}>
              <option value="scheduled">{getBookingStatusLabel("scheduled")}</option>
              <option value="closed">{getBookingStatusLabel("closed")}</option>
              <option value="cancelled">{getBookingStatusLabel("cancelled")}</option>
            </select>
          </section>
        ) : null}

        {message ? <p className="text-sm text-slate-600">{message}</p> : null}

        <button className="rounded-xl bg-[#0c7d69] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">
          {saving ? "Guardando..." : bookingId ? "Guardar cambios" : "Guardar turno"}
        </button>
      </form>

      {searchOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[26px] bg-white p-5 shadow-2xl lg:p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold">Buscar nombre o equipo</h2>
              <button className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm" onClick={() => setSearchOpen(false)} type="button">
                Cerrar
              </button>
            </div>

            <input className="mt-5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" placeholder="Escribe el nombre del cliente o equipo" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />

            {searchQuery.trim() ? (
              <button className="mt-3 rounded-xl border border-cyan-300 px-3.5 py-2.5 text-sm font-semibold text-cyan-700" onClick={handleUseCustomName} type="button">
                Usar &quot;{searchQuery.trim()}&quot; como nombre del cliente
              </button>
            ) : null}

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <section>
                <h3 className="text-base font-bold">Equipos</h3>
                <div className="mt-2.5 space-y-2">
                  {searchResults.teams.length > 0 ? (
                    searchResults.teams.map((team) => (
                      <button className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-left text-sm" key={team.id} onClick={() => handleSelectTeam(team)} type="button">
                        {team.name}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Sin resultados</p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-base font-bold">Jugadores</h3>
                <div className="mt-2.5 space-y-2">
                  {searchResults.users.length > 0 ? (
                    searchResults.users.map((user) => (
                      <button className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-left text-sm" key={user.id} onClick={() => handleSelectUser(user)} type="button">
                        <span className="block font-semibold text-slate-900">{user.firstName} {user.lastName}</span>
                        <span className="mt-1 block text-slate-500">{user.phone}</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Sin resultados</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
