"use client";

import { FormEvent, useEffect, useState } from "react";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

type Option = { id: string; name: string };

export function AdminExportPage() {
  const [teams, setTeams] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ from: "", to: "", teamId: "", exportAll: false, activeOnly: true });

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      const response = await fetch("/api/admin/teams", { cache: "no-store" });
      const payload = await readJsonResponse(response);

      if (response.ok && active) {
        setTeams(Array.isArray(payload?.items) ? payload.items.map((item: { id: string; name: string }) => ({ id: item.id, name: item.name })) : []);
      }
    }

    void loadOptions();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const params = new URLSearchParams();
      if (!form.exportAll && form.from) params.set("from", form.from);
      if (!form.exportAll && form.to) params.set("to", form.to);
      if (form.teamId) params.set("teamId", form.teamId);
      params.set("activeOnly", String(form.activeOnly));

      const response = await fetch(`/api/admin/exports/users.xlsx?${params.toString()}`);

      if (!response.ok) {
        const payload = await readJsonResponse(response);
        setMessage(getErrorMessage(payload, "No pudimos exportar la planilla"));
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "citygol-usuarios.xlsx";
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
    <div className="space-y-4">
      <section className="rounded-[26px] bg-white p-4 shadow-sm lg:p-5">
        <h1 className="text-[1.7rem] font-bold tracking-tight text-slate-950 lg:text-[1.85rem]">Exportación</h1>
        <p className="mt-2 text-[13px] leading-5 text-slate-600">Exporta usuarios registrados con sus datos actuales. Puedes descargar todos los registros o filtrar por fecha de alta, equipo y estado.</p>
      </section>

      <section className="rounded-[26px] bg-white p-4 shadow-sm lg:p-5">
        <form className="grid gap-4 sm:max-w-2xl" onSubmit={handleSubmit}>
          <label className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-[#fbfdff] px-4 py-3 text-sm text-slate-700">
            <input
              checked={form.exportAll}
              onChange={(event) => setForm((current) => ({ ...current, exportAll: event.target.checked }))}
              type="checkbox"
            />
            Exportar todos los registros
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Desde</span>
              <input className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm disabled:bg-slate-100 disabled:text-slate-400" disabled={form.exportAll} type="datetime-local" value={form.from} onChange={(event) => setForm((current) => ({ ...current, from: event.target.value }))} />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Hasta</span>
              <input className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm disabled:bg-slate-100 disabled:text-slate-400" disabled={form.exportAll} type="datetime-local" value={form.to} onChange={(event) => setForm((current) => ({ ...current, to: event.target.value }))} />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Equipo</span>
              <select className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" value={form.teamId} onChange={(event) => setForm((current) => ({ ...current, teamId: event.target.value }))}>
              <option value="">Todos los equipos</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Usuarios</span>
              <select className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" value={form.activeOnly ? "active" : "all"} onChange={(event) => setForm((current) => ({ ...current, activeOnly: event.target.value === "active" }))}>
                <option value="active">Solo usuarios activos</option>
                <option value="all">Todos los usuarios</option>
              </select>
            </label>
          </div>

          <p className="text-sm text-slate-500">
            {form.exportAll
              ? `Se exportarán ${form.activeOnly ? "todos los usuarios activos" : "todos los usuarios"} registrados en el sistema.`
              : `Se exportarán ${form.activeOnly ? "usuarios activos" : "todos los usuarios"} según los filtros seleccionados.`}
          </p>

          {message ? <p className="text-sm text-slate-600">{message}</p> : null}

          <button className="rounded-xl bg-[#0c7d69] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={loading} type="submit">
            {loading ? "Exportando..." : form.exportAll ? "Exportar todos los registros" : "Exportar registros"}
          </button>
        </form>
      </section>
    </div>
  );
}
