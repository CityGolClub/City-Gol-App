"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { formatArgentinaDateTime, formatArgentinaDateTimeLocalInput, formatArgentinaTimeRange } from "@/lib/datetime";
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

type FieldOption = {
  id: string;
  name: string;
  fieldType?: string;
};

type SettingsPayload = {
  bookingDurationMinutes: number;
  graceMinutes: number;
};

const PAGE_SIZE = 10;
const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";
const START_HOUR = 8;
const END_HOUR = 24;

function getBookingStatusLabel(status: BookingItem["status"]) {
  if (status === "scheduled") return "Agendado";
  if (status === "closed") return "Terminado";
  return "Cancelado";
}

function getBookingStatusClasses(status: BookingItem["status"]) {
  if (status === "scheduled") {
    return "bg-[#dff3ea] text-[#0b6a58]";
  }

  if (status === "closed") {
    return "bg-[#eef1f4] text-slate-600";
  }

  return "bg-[#ffe6e4] text-[#d44335]";
}

function getFieldTypeLabel(fieldType?: string) {
  if (fieldType === "futbol8") return "Futbol 8";
  return "Futbol 5";
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "SG";
}

function formatDateLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: ARGENTINA_TIME_ZONE,
  }).format(date);
}

function formatTodayHeading(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    timeZone: ARGENTINA_TIME_ZONE,
  })
    .format(date)
    .replace(".", "")
    .toUpperCase();
}

function getArgentinaDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ARGENTINA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}

function getArgentinaMinutesOfDay(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ARGENTINA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return hour * 60 + minute;
}

function getSlotLabel(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatTimeLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: ARGENTINA_TIME_ZONE,
  }).format(date);
}

function getPrimaryLabel(item: BookingItem) {
  return item.clientName ?? item.teamName ?? "Sin asignar";
}

function getSecondaryLabel(item: BookingItem) {
  if (item.clientName && item.teamName && item.clientName !== item.teamName) {
    return item.teamName;
  }

  if (item.clientPhone) {
    return item.clientPhone;
  }

  if (item.teamName) {
    return item.teamName;
  }

  return "Reserva manual";
}

function isOccupiedSlot(item: BookingItem, slotStart: number, slotEnd: number) {
  if (item.status === "cancelled") {
    return false;
  }

  const bookingStart = getArgentinaMinutesOfDay(item.startsAt);
  const bookingEnd = getArgentinaMinutesOfDay(item.endsAt);

  if (bookingStart === null || bookingEnd === null) {
    return false;
  }

  return bookingStart < slotEnd && bookingEnd > slotStart;
}

export function AdminBookingsPage() {
  const [items, setItems] = useState<BookingItem[]>([]);
  const [fields, setFields] = useState<FieldOption[]>([]);
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);

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
          setFields([]);
          return;
        }

        setItems(Array.isArray(payload?.items) ? payload.items : []);
        setFields(Array.isArray(payload?.fields) ? payload.fields : []);
        setSettings(payload?.settings ?? null);
        setPage(1);
      } catch {
        setError("No pudimos cargar los turnos");
        setItems([]);
        setFields([]);
        setSettings(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    function handleCloseMenu(event: MouseEvent) {
      if (actionsMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setOpenMenuId(null);
    }

    document.addEventListener("click", handleCloseMenu);
    return () => {
      document.removeEventListener("click", handleCloseMenu);
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const today = new Date();
  const todayKey = getArgentinaDateKey(today);
  const todayHeading = formatTodayHeading(today);
  const todaysItems = items.filter((item) => getArgentinaDateKey(item.startsAt) === todayKey);
  const slotMinutes = Math.max(settings?.bookingDurationMinutes ?? 60, 30);
  const totalMinutes = (END_HOUR - START_HOUR) * 60;
  const slots = Array.from({ length: Math.ceil(totalMinutes / slotMinutes) }, (_, index) => START_HOUR * 60 + index * slotMinutes).filter((slot) => slot < END_HOUR * 60);
  const fieldsForSchedule: FieldOption[] = fields.length
    ? fields
    : Array.from(new Map(items.map((item) => [item.fieldId, { id: item.fieldId, name: item.fieldName, fieldType: undefined } satisfies FieldOption])).values());

  async function handleDelete(id: string) {
    const response = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      setError(getErrorMessage(payload, "No pudimos eliminar el turno"));
      return;
    }

    setOpenMenuId(null);
    await loadBookings();
  }

  async function handleCancel(item: BookingItem) {
    const response = await fetch(`/api/admin/bookings/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fieldId: item.fieldId,
        teamId: item.teamId ?? "",
        clientName: item.clientName ?? "",
        clientPhone: item.clientPhone ?? "",
        startsAt: formatArgentinaDateTimeLocalInput(item.startsAt),
        status: "cancelled",
      }),
    });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      setError(getErrorMessage(payload, "No pudimos cancelar el turno"));
      return;
    }

    setOpenMenuId(null);
    await loadBookings();
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[26px] bg-white p-4 shadow-sm lg:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[1.7rem] font-bold tracking-tight text-slate-950 lg:text-[1.85rem]">Turnos</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-5 text-slate-600">Visualiza la ocupacion diaria de las canchas y administra las reservas desde un mismo panel.</p>
          </div>

          <Link className="inline-flex items-center gap-2 self-start rounded-full bg-[#0c6d5b] px-4.5 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(12,109,91,0.15)] transition hover:bg-[#0a5d4e]" href="/admin/bookings/new">
            <span className="text-sm leading-none">＋</span>
            Nuevo turno
          </Link>
        </div>
      </section>

      <section className="rounded-[26px] bg-white p-4 shadow-sm sm:p-5 lg:p-5.5">
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Cronograma diario - {todayHeading}</p>
            <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">Cada bloque representa {slotMinutes} minutos segun la duracion configurada del turno. Cancelados no bloquean disponibilidad.</p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-7 rounded-sm bg-[#0c6d5b]" />
              Ocupado
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-7 rounded-sm border border-slate-300 bg-white" />
              Libre
            </span>
          </div>
        </div>

        {loading ? <p className="mt-8 text-sm text-slate-600">Cargando cronograma...</p> : null}
        {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

        {!loading && !error ? (
          <div className="mt-6 overflow-x-auto pb-1">
            <div className="min-w-[920px] rounded-[24px] border border-slate-100 bg-[#fbfcff] p-3.5 sm:p-4">
              <div className="grid gap-x-1.5 gap-y-2.5" style={{ gridTemplateColumns: `144px repeat(${slots.length}, minmax(24px, 1fr))` }}>
                <div />
                {slots.map((slot) => (
                  <div className="text-center text-[10px] font-semibold tracking-[0.05em] text-slate-500" key={slot}>
                    {getSlotLabel(slot)}
                  </div>
                ))}

                {fieldsForSchedule.map((field) => {
                  const rowItems = todaysItems.filter((item) => item.fieldId === field.id);

                  return (
                    <div className="contents" key={field.id}>
                      <div className="flex items-center py-0.5 pr-2" key={`${field.id}-label`}>
                        <div>
                          <p className="text-[13px] font-semibold text-slate-900">{field.name}</p>
                          <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-400">{getFieldTypeLabel(field.fieldType)}</p>
                        </div>
                      </div>

                      {slots.map((slot) => {
                        const isOccupied = rowItems.some((item) => isOccupiedSlot(item, slot, slot + slotMinutes));

                        return (
                          <div
                            className={`h-7 rounded-[9px] border transition ${isOccupied ? "border-[#0c6d5b] bg-[#0c6d5b] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "border-slate-200 bg-white"}`}
                            key={`${field.id}-${slot}`}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {!fieldsForSchedule.length ? <p className="py-10 text-center text-sm text-slate-500">No hay canchas activas para mostrar en el cronograma.</p> : null}
              {fieldsForSchedule.length > 0 && todaysItems.length === 0 ? <p className="pt-6 text-sm text-slate-500">Todavia no hay turnos agendados para hoy.</p> : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-[26px] bg-white p-3.5 shadow-sm sm:p-4 lg:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Reservas</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950 sm:text-[1.35rem]">Agenda general</h2>
          </div>

          <p className="text-[11px] text-slate-500 sm:text-xs">Reservas reales del sistema ordenadas por fecha.</p>
        </div>

        {loading ? <p className="mt-8 text-sm text-slate-600">Cargando turnos...</p> : null}
        {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

        {!loading && !error ? (
          <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-100 bg-[#fcfdff]">
            <div className="hidden grid-cols-[2.2fr_1.8fr_1.1fr_1.2fr_1fr_56px] gap-3 border-b border-slate-100 bg-[#f6f8fc] px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 lg:grid">
              <p>Jugador / equipo</p>
              <p>Cancha</p>
              <p>Fecha</p>
              <p>Horario</p>
              <p>Estado</p>
              <p className="text-right">Acciones</p>
            </div>

            {paginatedItems.length ? (
              <div>
                {paginatedItems.map((item) => {
                  const primaryLabel = getPrimaryLabel(item);
                  const secondaryLabel = getSecondaryLabel(item);
                  const field = fields.find((entry) => entry.id === item.fieldId);
                  const fieldTypeLabel = getFieldTypeLabel(field?.fieldType);

                  return (
                    <div className="border-b border-slate-100 last:border-b-0" key={item.id}>
                      <div className="grid gap-3 px-3.5 py-3 lg:grid-cols-[2.2fr_1.8fr_1.1fr_1.2fr_1fr_56px] lg:items-center">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf3ef] text-[11px] font-bold uppercase text-[#285d52]">{getInitials(primaryLabel)}</div>
                          <div>
                            <p className="text-[13px] font-semibold leading-4 text-slate-950">{primaryLabel}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">{secondaryLabel}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[13px] font-medium text-slate-900">{item.fieldName}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{fieldTypeLabel}</p>
                        </div>

                        <div>
                          <p className="text-[13px] font-medium text-slate-900">{formatDateLabel(item.startsAt)}</p>
                        </div>

                        <div>
                          <p className="text-[13px] font-semibold text-slate-900">{formatArgentinaTimeRange(item.startsAt, item.endsAt)}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">Inicio {formatTimeLabel(item.startsAt)}</p>
                        </div>

                        <div>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${getBookingStatusClasses(item.status)}`}>
                            {getBookingStatusLabel(item.status)}
                          </span>
                        </div>

                        <div className="relative flex justify-end" ref={openMenuId === item.id ? actionsMenuRef : null}>
                          <button
                            aria-label={`Abrir acciones para ${primaryLabel}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-sm text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-800"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuId((current) => current === item.id ? null : item.id);
                            }}
                            type="button"
                          >
                            ⋮
                          </button>

                          {openMenuId === item.id ? (
                            <div className="absolute right-0 top-10 z-10 min-w-40 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_35px_rgba(15,23,42,0.12)]">
                              <Link className="block rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50" href={`/admin/bookings/${item.id}/edit`}>
                                Editar turno
                              </Link>
                              <button
                                className="block w-full rounded-xl px-3 py-2 text-left text-[13px] font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={item.status === "cancelled"}
                                onClick={() => void handleCancel(item)}
                                type="button"
                              >
                                Cancelar turno
                              </button>
                              <button
                                className="block w-full rounded-xl px-3 py-2 text-left text-[13px] font-medium text-red-600 transition hover:bg-red-50"
                                onClick={() => void handleDelete(item.id)}
                                type="button"
                              >
                                Eliminar registro
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-12 text-center text-sm text-slate-500">No hay turnos cargados todavia.</div>
            )}
          </div>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-xs">
            <p>
              Mostrando {(currentPage - 1) * PAGE_SIZE + 1} a {Math.min(currentPage * PAGE_SIZE, items.length)} de {items.length} reservas
            </p>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                type="button"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2.5 text-xs font-semibold transition ${pageNumber === currentPage ? "bg-[#0c6d5b] text-white shadow-[0_8px_16px_rgba(12,109,91,0.16)]" : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  type="button"
                >
                  {pageNumber}
                </button>
              ))}

              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={currentPage === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                type="button"
              >
                ›
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
