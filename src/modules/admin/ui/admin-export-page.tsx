"use client";

import { FormEvent, useMemo, useState } from "react";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

type Option = { id: string; name: string };

export function AdminExportPage() {
  const [fields, setFields] = useState<Option[]>([]);
  const [teams, setTeams] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ from: "", to: "", fieldId: "", teamId: "" });

  const loadOptions = useMemo(
    () => async () => {
      const [fieldsResponse, teamsResponse] = await Promise.all([
        fetch("/api/admin/fields", { cache: "no-store" }),
        fetch("/api/admin/teams", { cache: "no-store" }),
      ]);

      const [fieldsPayload, teamsPayload] = await Promise.all([readJsonResponse(fieldsResponse), readJsonResponse(teamsResponse)]);
      if (fieldsResponse.ok) setFields(Array.isArray(fieldsPayload?.items) ? fieldsPayload.items : []);
      if (teamsResponse.ok) setTeams(Array.isArray(teamsPayload?.items) ? teamsPayload.items.map((item: { id: string; name: string }) => ({ id: item.id, name: item.name })) : []);
    },
    [],
  );

  useMemo(() => {
    void loadOptions();
  }, [loadOptions]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const params = new URLSearchParams();
      if (form.from) params.set("from", form.from);
      if (form.to) params.set("to", form.to);
      if (form.fieldId) params.set("fieldId", form.fieldId);
      if (form.teamId) params.set("teamId", form.teamId);

      const response = await fetch(`/api/admin/exports/checkins.xlsx?${params.toString()}`);

      if (!response.ok) {
        const payload = await readJsonResponse(response);
        setMessage(getErrorMessage(payload, "No pudimos exportar la planilla"));
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "citygol-checkins.xlsx";
      anchor.click();
      window.URL.revokeObjectURL(url);
      setMessage("Exportación generada");
    } catch {
      setMessage("No pudimos exportar la planilla");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
        <h1 className="text-4xl font-bold">Exportación</h1>
        <p className="mt-3 text-base text-slate-600">Exporta check-ins en formato xlsx por rango de fechas, cancha y equipo.</p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
        <form className="grid gap-4 sm:max-w-2xl" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="rounded-2xl border border-slate-200 px-4 py-3" type="datetime-local" value={form.from} onChange={(event) => setForm((current) => ({ ...current, from: event.target.value }))} />
            <input className="rounded-2xl border border-slate-200 px-4 py-3" type="datetime-local" value={form.to} onChange={(event) => setForm((current) => ({ ...current, to: event.target.value }))} />
            <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.fieldId} onChange={(event) => setForm((current) => ({ ...current, fieldId: event.target.value }))}>
              <option value="">Todas las canchas</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>{field.name}</option>
              ))}
            </select>
            <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.teamId} onChange={(event) => setForm((current) => ({ ...current, teamId: event.target.value }))}>
              <option value="">Todos los equipos</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          {message ? <p className="text-sm text-slate-600">{message}</p> : null}

          <button className="rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={loading} type="submit">
            {loading ? "Exportando..." : "Exportar registros"}
          </button>
        </form>
      </section>
    </div>
  );
}
