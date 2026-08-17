"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

type TeamOption = { id: string; name: string };
type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  role: "user" | "admin";
  isActive: boolean;
  team: { id: string; name: string } | null;
  scores: { total: number; monthly: number; vigente: number };
};

export function AdminUsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [scoreSaving, setScoreSaving] = useState(false);
  const [editMessage, setEditMessage] = useState<string | null>(null);

  const loadUsers = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("q", search.trim());
        if (teamFilter) params.set("teamId", teamFilter);

        const response = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
        const payload = await readJsonResponse(response);

        if (!response.ok) {
          setError(getErrorMessage(payload, "No pudimos cargar los usuarios"));
          setItems([]);
          return;
        }

        setItems(Array.isArray(payload?.items) ? payload.items : []);
        setTeams(Array.isArray(payload?.teams) ? payload.teams : []);
      } catch {
        setError("No pudimos cargar los usuarios");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [search, teamFilter],
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    setEditMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedUser),
      });
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        setEditMessage(getErrorMessage(payload, "No pudimos guardar los cambios"));
        return;
      }

      setEditMessage("Cambios guardados");
      await loadUsers();
    } catch {
      setEditMessage("No pudimos guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  async function handleScoreAdjustment(formData: FormData) {
    if (!selectedUser) return;
    setScoreSaving(true);
    setEditMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/score-adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scoreType: formData.get("scoreType"),
          delta: Number(formData.get("delta")),
          reason: formData.get("reason"),
        }),
      });
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        setEditMessage(getErrorMessage(payload, "No pudimos ajustar el score"));
        return;
      }

      setEditMessage("Score ajustado");
      await loadUsers();
    } catch {
      setEditMessage("No pudimos ajustar el score");
    } finally {
      setScoreSaving(false);
    }
  }

  const selectedTeamName = selectedUser?.team?.name ?? "Sin asignar";

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 rounded-[26px] bg-white p-4 shadow-sm lg:flex-row lg:items-start lg:justify-between lg:p-5">
        <div>
          <h1 className="text-[1.7rem] font-bold tracking-tight text-slate-950 lg:text-[1.85rem]">Gestión de Jugadores</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-5 text-slate-600">
            Administra los perfiles de los atletas, revisa sus estadisticas de rendimiento y asigna equipos dentro del complejo.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <select
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm"
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
          >
            <option value="">Todos los equipos</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          <button className="rounded-xl border border-cyan-300 px-4 py-2.5 text-sm font-semibold text-cyan-700" type="button">
            Exportar Registros
          </button>
        </div>
      </section>

      <section className="rounded-[26px] bg-white p-4 shadow-sm lg:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm sm:max-w-sm"
            placeholder="Buscar por nombre, email o telefono"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <button className="rounded-xl bg-[#0c7d69] px-4 py-2.5 text-sm font-semibold text-white" onClick={() => void loadUsers()} type="button">
            Buscar
          </button>
        </div>

        {loading ? <p className="text-sm text-slate-600">Cargando usuarios...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !error ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f2f5ff] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="rounded-l-xl px-3.5 py-3">Jugador</th>
                  <th className="px-3.5 py-3">Email</th>
                  <th className="px-3.5 py-3">Telefono</th>
                  <th className="px-3.5 py-3">Equipo</th>
                  <th className="px-3.5 py-3">Score</th>
                  <th className="rounded-r-xl px-3.5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className="border-b border-slate-100" key={item.id}>
                    <td className="px-3.5 py-3 font-semibold text-slate-900">
                      {item.firstName}
                      <br />
                      {item.lastName}
                    </td>
                    <td className="px-3.5 py-3 text-slate-700">{item.email}</td>
                    <td className="px-3.5 py-3 text-slate-700">{item.phone}</td>
                    <td className="px-3.5 py-3 text-slate-700">{item.team?.name ?? "Sin asignar"}</td>
                    <td className="px-3.5 py-3">
                      <button className="text-2xl font-bold text-cyan-700" onClick={() => setSelectedUser(item)} type="button">
                        {item.scores.vigente}
                      </button>
                    </td>
                    <td className="px-3.5 py-3">
                      <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setSelectedUser(item)} type="button">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[26px] bg-white p-5 shadow-2xl lg:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Detalle del jugador</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
              </div>

              <button className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm" onClick={() => setSelectedUser(null)} type="button">
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <article className="rounded-xl border border-slate-200 p-3.5">
                <p className="text-sm text-slate-500">Score vigente</p>
                <p className="mt-1.5 text-2xl font-bold text-cyan-700">{selectedUser.scores.vigente}</p>
              </article>
              <article className="rounded-xl border border-slate-200 p-3.5">
                <p className="text-sm text-slate-500">Score mensual</p>
                <p className="mt-1.5 text-2xl font-bold text-slate-900">{selectedUser.scores.monthly}</p>
              </article>
              <article className="rounded-xl border border-slate-200 p-3.5">
                <p className="text-sm text-slate-500">Score total</p>
                <p className="mt-1.5 text-2xl font-bold text-slate-900">{selectedUser.scores.total}</p>
              </article>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSave}>
              <div className="grid gap-4 sm:grid-cols-2">
                <input className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" value={selectedUser.firstName} onChange={(event) => setSelectedUser({ ...selectedUser, firstName: event.target.value })} placeholder="Nombre" />
                <input className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" value={selectedUser.lastName} onChange={(event) => setSelectedUser({ ...selectedUser, lastName: event.target.value })} placeholder="Apellido" />
                <input className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" value={selectedUser.email} onChange={(event) => setSelectedUser({ ...selectedUser, email: event.target.value })} placeholder="Email" />
                <input className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" value={selectedUser.phone} onChange={(event) => setSelectedUser({ ...selectedUser, phone: event.target.value })} placeholder="Telefono" />
                <input className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" type="date" value={selectedUser.birthDate} onChange={(event) => setSelectedUser({ ...selectedUser, birthDate: event.target.value })} />
                <select className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" value={selectedUser.role} onChange={(event) => setSelectedUser({ ...selectedUser, role: event.target.value as "user" | "admin" })}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input checked={selectedUser.isActive} onChange={(event) => setSelectedUser({ ...selectedUser, isActive: event.target.checked })} type="checkbox" />
                Usuario activo
              </label>

              <div className="rounded-xl bg-slate-50 p-3.5 text-sm text-slate-600">Equipo actual: {selectedTeamName}</div>

              <button className="rounded-xl bg-[#0c7d69] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>

            <form
              className="mt-6 grid gap-4 rounded-[24px] border border-slate-200 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleScoreAdjustment(new FormData(event.currentTarget));
              }}
            >
              <h3 className="text-base font-bold">Ajustar score</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <select className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" name="scoreType" defaultValue="vigente">
                  <option value="vigente">Vigente</option>
                  <option value="monthly">Mensual</option>
                  <option value="total">Total</option>
                </select>
                <input className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" name="delta" placeholder="Delta (+/-)" type="number" />
                <input className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm sm:col-span-3" name="reason" placeholder="Motivo" />
              </div>

              {editMessage ? <p className="text-sm text-slate-600">{editMessage}</p> : null}

              <button className="rounded-xl border border-cyan-300 px-4 py-3 text-sm font-semibold text-cyan-700 disabled:opacity-60" disabled={scoreSaving} type="submit">
                {scoreSaving ? "Ajustando..." : "Aplicar ajuste"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
