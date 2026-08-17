"use client";

import { FormEvent, useEffect, useState } from "react";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

const durationPresets = [30, 60, 90];
const gracePresets = [0, 15, 30];

function formatMinutesLabel(value: number) {
  return `${value} min`;
}

export function AdminSettingsPage() {
  const [form, setForm] = useState({ bookingDurationMinutes: 60, graceMinutes: 30 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      const response = await fetch("/api/admin/settings", { cache: "no-store" });
      const payload = await readJsonResponse(response);

      if (response.ok && active) {
        setForm({
          bookingDurationMinutes: payload.bookingDurationMinutes,
          graceMinutes: payload.graceMinutes,
        });
      }

      if (!response.ok && active) {
        setMessage(getErrorMessage(payload, "No pudimos cargar la configuracion"));
      }

      if (active) setLoading(false);
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      setMessage(getErrorMessage(payload, "No pudimos guardar la configuracion"));
      setSaving(false);
      return;
    }

    setMessage("Configuracion guardada");
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[26px] bg-white p-4 shadow-sm lg:p-5">
        <h1 className="text-[1.7rem] font-bold tracking-tight text-slate-950 lg:text-[1.85rem]">Configuración</h1>
        <p className="mt-2 text-[13px] leading-5 text-slate-600">Define cómo se comportan los turnos en todo el sistema y qué margen tienen los jugadores para hacer check-in.</p>
      </section>

      <section className="rounded-[26px] bg-white p-4 shadow-sm lg:p-5">
        {loading ? <p className="text-sm text-slate-600">Cargando configuración...</p> : null}

        {!loading ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <section className="rounded-[24px] bg-[#fbfdff] p-5 shadow-sm sm:p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Reglas de turnos</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Define la duración y el margen del check-in</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Estos valores se aplican a todos los turnos nuevos y actualizan la ventana disponible para validar asistencia.</p>

                <div className="mt-5 grid gap-5">
                  <div className="grid gap-2.5">
                    <label className="grid gap-2">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Duración de turno</span>
                      <input
                        className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                        min={1}
                        step={1}
                        type="number"
                        value={form.bookingDurationMinutes}
                        onChange={(event) => setForm((current) => ({ ...current, bookingDurationMinutes: Number(event.target.value) }))}
                        placeholder="Duración de turno"
                      />
                    </label>
                    <p className="text-sm text-slate-500">Tiempo total que ocupa una reserva de cancha. Ejemplo habitual: 60 minutos.</p>
                    <div className="flex flex-wrap gap-2">
                      {durationPresets.map((value) => (
                        <button
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${form.bookingDurationMinutes === value ? "border-[#0c7d69] bg-[#e5f5f0] text-[#0c6d5b]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                          key={value}
                          onClick={() => setForm((current) => ({ ...current, bookingDurationMinutes: value }))}
                          type="button"
                        >
                          {formatMinutesLabel(value)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2.5">
                    <label className="grid gap-2">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Minutos de gracia</span>
                      <input
                        className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                        max={30}
                        min={0}
                        step={1}
                        type="number"
                        value={form.graceMinutes}
                        onChange={(event) => setForm((current) => ({ ...current, graceMinutes: Number(event.target.value) }))}
                        placeholder="Minutos de gracia"
                      />
                    </label>
                    <p className="text-sm text-slate-500">Margen antes y después del turno durante el cual el check-in sigue habilitado.</p>
                    <div className="flex flex-wrap gap-2">
                      {gracePresets.map((value) => (
                        <button
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${form.graceMinutes === value ? "border-[#0c7d69] bg-[#e5f5f0] text-[#0c6d5b]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                          key={value}
                          onClick={() => setForm((current) => ({ ...current, graceMinutes: value }))}
                          type="button"
                        >
                          {formatMinutesLabel(value)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {message ? <p className="text-sm text-slate-600">{message}</p> : <span />}

                  <button className="rounded-xl bg-[#0c7d69] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">
                    {saving ? "Guardando..." : "Guardar configuración"}
                  </button>
                </div>
              </section>
            </form>

            <section className="rounded-[24px] bg-[#fbfdff] p-5 shadow-sm sm:p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Resumen actual</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Cómo se aplicará esta configuración</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Vista rápida para entender cómo impactan estos valores en la operatoria diaria.</p>

              <div className="mt-5 grid gap-3">
                <article className="rounded-[18px] border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Duración efectiva</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{formatMinutesLabel(form.bookingDurationMinutes)}</p>
                  <p className="mt-1 text-sm text-slate-500">Cada reserva ocupará ese tiempo dentro del cronograma.</p>
                </article>

                <article className="rounded-[18px] border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Check-in anticipado</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{formatMinutesLabel(form.graceMinutes)} antes</p>
                  <p className="mt-1 text-sm text-slate-500">Los jugadores podrán confirmar asistencia antes del inicio del turno.</p>
                </article>

                <article className="rounded-[18px] border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Check-in posterior</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{formatMinutesLabel(form.graceMinutes)} después</p>
                  <p className="mt-1 text-sm text-slate-500">El turno seguirá aceptando check-ins aun luego de finalizado el horario formal.</p>
                </article>

                <article className="rounded-[18px] bg-[#eef7f3] p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Ejemplo práctico</p>
                  <p className="mt-1 leading-6">Si un turno empieza a las 19:00 y dura {form.bookingDurationMinutes} minutos, el check-in se habilitará {form.graceMinutes} minutos antes y seguirá disponible {form.graceMinutes} minutos después de su finalización.</p>
                </article>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </div>
  );
}
