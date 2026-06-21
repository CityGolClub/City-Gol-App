"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { LoginForm } from "@/modules/auth/ui/login-form";
import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

type CheckinFlowProps = {
  token: string;
};

type BookingPayload = {
  booking: {
    id: string;
    fieldId: string;
    fieldName: string;
    fieldType: string;
    startsAt: string;
    endsAt: string;
    validFrom: string;
    validUntil: string;
    qrToken: string;
    checkinLimit: number;
    checkinsUsed: number;
    isFull: boolean;
    isAvailable: boolean;
    status: string;
    message: string | null;
  };
  viewer: {
    authenticated: boolean;
    alreadyCheckedIn: boolean;
  };
};

type ConfirmPayload = {
  success: boolean;
  message: string;
  showConfirmationModal: boolean;
  booking: {
    id: string;
    fieldName: string;
    startsAt: string;
    endsAt: string;
  };
  scores: {
    total: number;
    monthly: number;
    vigente: number;
  };
  panelSummary: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
    team: {
      id: string;
      name: string;
      isOwner: boolean;
    } | null;
    scores: {
      total: number;
      monthly: number;
      vigente: number;
    };
  };
};

function formatRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const formatter = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

export function CheckinFlow({ token }: CheckinFlowProps) {
  const [payload, setPayload] = useState<BookingPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmPayload | null>(null);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/checkin/${token}`, { cache: "no-store" });
      const result = await readJsonResponse(response);

      if (!response.ok) {
        setError(getErrorMessage(result, "No pudimos cargar el turno"));
        setPayload(null);
        return;
      }

      setPayload(result as BookingPayload);
    } catch {
      setError("No pudimos cargar el turno");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  useEffect(() => {
    if (!confirmation) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setConfirmation(null);
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [confirmation]);

  const registerHref = useMemo(() => `/register?redirect=${encodeURIComponent(`/checkin/${token}`)}`, [token]);
  const forgotPasswordHref = useMemo(() => `/forgot-password?redirect=${encodeURIComponent(`/checkin/${token}`)}`, [token]);

  async function handleCheckin() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkin/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrToken: token }),
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        setError(getErrorMessage(result, "No pudimos confirmar el check-in"));
        await loadBooking();
        return;
      }

      setConfirmation(result as ConfirmPayload);
      await loadBooking();
    } catch {
      setError("No pudimos confirmar el check-in");
    } finally {
      setSubmitting(false);
    }
  }

  const booking = payload?.booking;
  const viewer = payload?.viewer;

  const statusMessage = error ?? booking?.message ?? (viewer?.alreadyCheckedIn ? "Ya registramos tu llegada para este turno" : null);
  const showLogin = Boolean(booking && booking.isAvailable && !booking.isFull && viewer && !viewer.authenticated && !viewer.alreadyCheckedIn);
  const showCheckinButton = Boolean(booking && viewer?.authenticated && booking.isAvailable && !booking.isFull && !viewer.alreadyCheckedIn);
  const showStatusOnly = Boolean(booking && (!booking.isAvailable || booking.isFull || viewer?.alreadyCheckedIn));

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">City Gol</p>
        <h1 className="mt-4 text-3xl font-bold">Check-in</h1>

        {loading ? <p className="mt-4 text-slate-600">Cargando turno...</p> : null}

        {!loading && !booking ? <p className="mt-4 text-red-600">{statusMessage ?? "No pudimos cargar el turno"}</p> : null}

        {booking ? (
          <div className="mt-6 rounded-2xl border border-slate-200 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{booking.fieldType}</p>
            <h2 className="mt-2 text-2xl font-bold">{booking.fieldName}</h2>
            <p className="mt-2 text-lg font-semibold">{formatRange(booking.startsAt, booking.endsAt)}</p>
            <p className="mt-2 text-sm text-slate-600">
              {booking.checkinsUsed} / {booking.checkinLimit} check-ins
            </p>

            {statusMessage ? <p className="mt-4 text-sm text-slate-700">{statusMessage}</p> : null}

            {showLogin ? (
              <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                <h3 className="text-lg font-semibold">Inicia sesion para confirmar tu llegada</h3>
                <div className="mt-4">
                  <LoginForm
                    redirect={`/checkin/${token}`}
                    onSuccess={loadBooking}
                    registerHref={registerHref}
                    forgotPasswordHref={forgotPasswordHref}
                  />
                </div>
              </div>
            ) : null}

            {showCheckinButton ? (
              <div className="mt-6 flex flex-col gap-3">
                <button
                  className="rounded-xl bg-cyan-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
                  disabled={submitting}
                  onClick={handleCheckin}
                  type="button"
                >
                  {submitting ? "Confirmando..." : "Hacer check-in"}
                </button>
              </div>
            ) : null}

            {showStatusOnly && !showLogin && !showCheckinButton ? (
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                {statusMessage ?? "Este turno no permite nuevas acciones en este momento"}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {confirmation ? (
        <section className="rounded-3xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
          <h2 className="text-xl font-bold">{confirmation.message}</h2>
          <p className="mt-2 text-sm">Este mensaje se cierra automaticamente en 2.5 segundos.</p>
        </section>
      ) : null}

      {confirmation?.panelSummary ? (
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">Resumen del panel</h2>
          <p className="mt-3 text-slate-700">
            {confirmation.panelSummary.user.firstName} {confirmation.panelSummary.user.lastName}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Score total</p>
              <p className="mt-2 text-2xl font-bold">{confirmation.panelSummary.scores.total}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Score mensual</p>
              <p className="mt-2 text-2xl font-bold">{confirmation.panelSummary.scores.monthly}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Score vigente</p>
              <p className="mt-2 text-2xl font-bold">{confirmation.panelSummary.scores.vigente}</p>
            </article>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Equipo</p>
            <p className="mt-2 text-lg font-semibold">
              {confirmation.panelSummary.team ? confirmation.panelSummary.team.name : "Sin equipo"}
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}
