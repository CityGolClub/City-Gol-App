"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

type VisibleBooking = {
  id: string;
  startsAt: string;
  endsAt: string;
  validFrom: string;
  validUntil: string;
  qrToken: string;
  checkinsUsed: number;
  checkinLimit: number;
  isFull: boolean;
  isAvailable: boolean;
  message: string | null;
  displayKind: "previous" | "current" | "next";
};

type QrPanelResponse = {
  field: {
    id: string;
    name: string;
    fieldType: string;
  };
  visibleBookings: VisibleBooking[];
};

function formatRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

function getDisplayLabel(displayKind: VisibleBooking["displayKind"]) {
  if (displayKind === "current") return "Turno vigente";
  if (displayKind === "previous") return "Turno anterior";
  return "Turno siguiente";
}

function getStatusText(booking: VisibleBooking) {
  if (booking.isFull) return "Completo";
  if (!booking.isAvailable) return booking.message ?? "No disponible";
  return "Disponible";
}

export function FieldQrPanel({ fieldId }: { fieldId: string }) {
  const [data, setData] = useState<QrPanelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const appUrl = useMemo(() => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", []);

  useEffect(() => {
    let active = true;

    async function loadPanel() {
      try {
        if (active) {
          setError(null);
        }

        const response = await fetch(`/api/fields/${fieldId}/qr-panel`, { cache: "no-store" });
        const payload = await readJsonResponse(response);

        if (!response.ok) {
          if (active) {
            setError(getErrorMessage(payload, "No pudimos cargar los QR de la cancha"));
            setData(null);
          }
          return;
        }

        if (active) {
          setData(payload as QrPanelResponse);
        }
      } catch {
        if (active) {
          setError("No pudimos cargar los QR de la cancha");
          setData(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPanel();
    const interval = window.setInterval(() => {
      void loadPanel();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [fieldId]);

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-12">
      <section className="flex items-center justify-between gap-4 rounded-3xl bg-white p-8 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">City Gol</p>
          <h1 className="mt-4 text-4xl font-bold">{data?.field.name ?? "Panel QR"}</h1>
          <p className="mt-3 text-slate-600">{data?.field.fieldType ? `Cancha tipo ${data.field.fieldType}` : "Cargando detalle de cancha..."}</p>
        </div>

        <Link className="rounded-full border border-cyan-200 px-5 py-3 text-sm font-semibold text-cyan-800" href="/qr">
          Volver
        </Link>
      </section>

      {loading ? <p className="text-slate-600">Cargando QRs...</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      {!loading && !error && data?.visibleBookings.length === 0 ? (
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-slate-600">No hay bookings visibles para esta cancha en este momento.</p>
        </section>
      ) : null}

      {data?.visibleBookings.length ? (
        <section className="grid gap-5 xl:grid-cols-3">
          {data.visibleBookings.map((booking) => {
            const qrValue = `${appUrl}/checkin/${booking.qrToken}`;

            return (
              <article key={booking.id} className="rounded-3xl bg-white p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">{getDisplayLabel(booking.displayKind)}</p>
                <h2 className="mt-4 text-3xl font-bold">{formatRange(booking.startsAt, booking.endsAt)}</h2>
                <p className="mt-2 text-sm text-slate-600">{booking.checkinsUsed} / {booking.checkinLimit} check-ins</p>
                <p className="mt-2 text-sm font-medium text-slate-700">{getStatusText(booking)}</p>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="mx-auto aspect-square max-w-[260px] rounded-2xl bg-white p-3">
                    <QRCode size={232} style={{ height: "auto", maxWidth: "100%", width: "100%" }} value={qrValue} />
                  </div>
                </div>

                <p className="mt-4 break-all text-xs text-slate-500">{qrValue}</p>
              </article>
            );
          })}
        </section>
      ) : null}
    </main>
  );
}
