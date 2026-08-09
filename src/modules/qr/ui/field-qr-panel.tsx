"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  if (displayKind === "current") return "TURNO VIGENTE";
  if (displayKind === "previous") return "TURNO ANTERIOR";
  return "TURNO SIGUIENTE";
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
  const [origin, setOrigin] = useState(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setOrigin(window.location.origin);
  }, []);

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

  const mainBooking = data?.visibleBookings[0] ?? null;
  const secondaryBooking = data?.visibleBookings[1] ?? null;

  return (
    <main className="min-h-screen bg-[#f6f8ff] px-4 py-6 text-slate-900 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1400px]">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 text-slate-900">
            <p className="text-2xl font-bold text-cyan-700">City Gol</p>
            <div className="hidden h-10 w-px bg-slate-300 sm:block" />
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em]">{data?.field.name ?? "Cancha"}</p>
              <p className="text-sm text-slate-500">Check-in Station</p>
            </div>
          </div>

          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700" href="/qr">
            <span aria-hidden="true">←</span>
            Volver
          </Link>
        </header>

        {loading ? <p className="mt-10 text-slate-600">Cargando QRs...</p> : null}
        {error ? <p className="mt-10 text-red-600">{error}</p> : null}

        {!loading && !error && !mainBooking ? (
          <section className="mt-10 rounded-[28px] bg-white p-8 shadow-sm">
            <p className="text-slate-600">No hay bookings visibles para esta cancha en este momento.</p>
          </section>
        ) : null}

        {mainBooking ? (
          <section className="mt-10 grid gap-4 lg:grid-cols-[2.15fr_1fr] lg:items-stretch">
            <article className="rounded-[28px] bg-gradient-to-br from-[#20847d] to-[#1f8f8a] px-6 py-7 text-white shadow-[0_24px_50px_rgba(31,143,138,0.2)] sm:px-8 sm:py-10">
              <div className="mx-auto max-w-xl text-center">
                <p className="mx-auto inline-flex rounded-full bg-white/14 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
                  {getDisplayLabel(mainBooking.displayKind)}
                </p>
                <h2 className="mt-6 text-5xl font-bold sm:text-6xl">{formatRange(mainBooking.startsAt, mainBooking.endsAt)}</h2>
                <p className="mt-5 text-lg font-medium text-white/95">Escanea con la camara de tu celular para confirmar tu llegada</p>

                <div className="mx-auto mt-10 max-w-[330px] rounded-[30px] bg-white p-5 shadow-[0_20px_45px_rgba(0,0,0,0.18)] sm:max-w-[360px] sm:p-6">
                  <div className="rounded-[22px] bg-white p-4">
                    <QRCode size={280} style={{ height: "auto", maxWidth: "100%", width: "100%" }} value={`${origin}/checkin/${mainBooking.qrToken}`} />
                  </div>
                </div>

                <div className="mt-6 text-sm text-white/90">
                  <p>
                    {mainBooking.checkinsUsed} / {mainBooking.checkinLimit} check-ins
                  </p>
                  <p className="mt-2 font-medium">{getStatusText(mainBooking)}</p>
                </div>
              </div>
            </article>

            <article className="rounded-[28px] bg-[#dce9ff] px-6 py-8 text-slate-900 shadow-sm sm:px-8">
              {secondaryBooking ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{getDisplayLabel(secondaryBooking.displayKind)}</p>
                  <h3 className="mt-5 text-4xl font-bold">{formatRange(secondaryBooking.startsAt, secondaryBooking.endsAt)}</h3>

                  <div className="mt-10 w-full max-w-[220px] rounded-[26px] bg-white/80 p-4 shadow-sm">
                    <div className="rounded-[18px] bg-white p-3">
                      <QRCode size={180} style={{ height: "auto", maxWidth: "100%", width: "100%" }} value={`${origin}/checkin/${secondaryBooking.qrToken}`} />
                    </div>
                  </div>

                  <div className="mt-6 text-sm text-slate-600">
                    <p>
                      {secondaryBooking.checkinsUsed} / {secondaryBooking.checkinLimit} check-ins
                    </p>
                    <p className="mt-2 font-medium text-slate-700">{getStatusText(secondaryBooking)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-[22px] border border-white/60 bg-white/40 p-6 text-center text-slate-500">
                  No hay turno siguiente visible ahora.
                </div>
              )}
            </article>
          </section>
        ) : null}
      </div>
    </main>
  );
}
