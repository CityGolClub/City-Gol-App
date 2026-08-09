"use client";

import { FormEvent, useEffect, useState } from "react";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

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
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
        <h1 className="text-4xl font-bold">Configuración</h1>
        <p className="mt-3 text-base text-slate-600">Edita la duración global de turno y la gracia del sistema.</p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
        {loading ? <p className="text-sm text-slate-600">Cargando configuración...</p> : null}

        {!loading ? (
          <form className="grid gap-4 sm:max-w-xl" onSubmit={handleSubmit}>
            <input className="rounded-2xl border border-slate-200 px-4 py-3" type="number" value={form.bookingDurationMinutes} onChange={(event) => setForm((current) => ({ ...current, bookingDurationMinutes: Number(event.target.value) }))} placeholder="Duración de turno" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3" type="number" max={30} value={form.graceMinutes} onChange={(event) => setForm((current) => ({ ...current, graceMinutes: Number(event.target.value) }))} placeholder="Minutos de gracia" />

            {message ? <p className="text-sm text-slate-600">{message}</p> : null}

            <button className="rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">
              {saving ? "Guardando..." : "Guardar configuración"}
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
