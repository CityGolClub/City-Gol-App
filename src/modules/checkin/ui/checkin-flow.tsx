"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
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
    <main className="relative mx-auto flex min-h-screen max-w-4xl flex-col gap-6 bg-[#f5f8ff] px-4 py-6 sm:px-6 sm:py-10">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">City Gol</p>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Check-in</h1>

        {loading ? <p className="mt-4 text-slate-600">Cargando turno...</p> : null}

        {!loading && !booking ? <p className="mt-4 text-red-600">{statusMessage ?? "No pudimos cargar el turno"}</p> : null}

        {booking ? (
          <div className="mt-6 rounded-3xl border border-slate-200 p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{booking.fieldType}</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{booking.fieldName}</h2>
            <p className="mt-2 text-lg font-semibold">{formatRange(booking.startsAt, booking.endsAt)}</p>
            <p className="mt-2 text-sm text-slate-600">
              {booking.checkinsUsed} / {booking.checkinLimit} check-ins
            </p>

            {statusMessage ? <p className="mt-4 text-sm text-slate-700">{statusMessage}</p> : null}

            {showLogin ? (
              <div className="mt-6 rounded-3xl border border-slate-200 p-4 sm:p-5">
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
                  className="w-full rounded-2xl bg-cyan-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6">
          <section className="w-full max-w-xl rounded-[32px] bg-white p-6 shadow-2xl sm:p-8">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-cyan-700 text-5xl text-white">✓</div>
            <h2 className="mt-6 text-center text-3xl font-bold text-cyan-800">Check-in Exitoso!</h2>
            <p className="mx-auto mt-4 max-w-md text-center text-base leading-7 text-slate-700">
              Tu llegada para la reserva de <span className="font-semibold">{confirmation.booking.fieldName}</span> ha sido confirmada.
              Todo esta listo para que inicies tu partido.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cancha</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{confirmation.booking.fieldName}</p>
              </article>

              <article className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hora</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{formatRange(confirmation.booking.startsAt, confirmation.booking.endsAt)}</p>
              </article>
            </div>

            <button
              className="mt-6 w-full rounded-2xl bg-cyan-700 px-4 py-3 font-semibold text-white"
              onClick={() => router.push("/panel")}
              type="button"
            >
              Ir a mi panel
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
