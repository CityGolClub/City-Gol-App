"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

type RedemptionItem = {
  id: string;
  userId: string;
  userName: string;
  pointsSpent: number;
  description: string;
  createdAt: string;
};

type UserOption = {
  id: string;
  label: string;
  scoreVigente: number;
};

export function AdminRedemptionsPage() {
  const [items, setItems] = useState<RedemptionItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [playerPickerOpen, setPlayerPickerOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ userId: "", pointsSpent: 1, description: "" });
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const loadRedemptions = useMemo(
    () => async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/admin/redemptions", { cache: "no-store" });
        const payload = await readJsonResponse(response);

        if (!response.ok) {
          setError(getErrorMessage(payload, "No pudimos cargar los canjes"));
          setItems([]);
          return;
        }

        setItems(Array.isArray(payload?.items) ? payload.items : []);
        setUsers(Array.isArray(payload?.users) ? payload.users : []);
      } catch {
        setError("No pudimos cargar los canjes");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadRedemptions();
  }, [loadRedemptions]);

  const filteredItems = items.filter((item) => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return true;
    return item.userName.toLowerCase().includes(normalized) || item.description.toLowerCase().includes(normalized);
  });

  const filteredUsers = users.filter((user) => {
    const normalized = userSearch.trim().toLowerCase();
    if (!normalized) return true;
    return user.label.toLowerCase().includes(normalized);
  });

  const selectedUser = users.find((user) => user.id === form.userId) ?? null;

  function handleSelectUser(user: UserOption) {
    setForm((current) => ({ ...current, userId: user.id }));
    setPlayerPickerOpen(false);
    setUserSearch("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/admin/redemptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      setMessage(getErrorMessage(payload, "No pudimos registrar el canje"));
      setSaving(false);
      return;
    }

    setMessage("Canje registrado");
    setSaving(false);
    setOpen(false);
    setPlayerPickerOpen(false);
    setForm({ userId: "", pointsSpent: 1, description: "" });
    await loadRedemptions();
  }

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 rounded-[26px] bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-5">
        <div>
          <h1 className="text-[1.7rem] font-bold tracking-tight text-slate-950 lg:text-[1.85rem]">Canjes</h1>
          <p className="mt-2 text-[13px] leading-5 text-slate-600">Registra y consulta canjes de score vigente.</p>
        </div>

        <button className="rounded-xl bg-[#0c7d69] px-4 py-3 text-sm font-semibold text-white" onClick={() => setOpen(true)} type="button">
          Registrar canje
        </button>
      </section>

      <section className="rounded-[26px] bg-white p-4 shadow-sm lg:p-5">
        <div className="mb-4">
          <input
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm sm:max-w-sm"
            placeholder="Buscar por jugador o descripción"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? <p className="text-sm text-slate-600">Cargando canjes...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !error ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f2f5ff] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="rounded-l-xl px-3.5 py-3">Jugador</th>
                  <th className="px-3.5 py-3">Puntos</th>
                  <th className="px-3.5 py-3">Descripción</th>
                  <th className="rounded-r-xl px-3.5 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr className="border-b border-slate-100" key={item.id}>
                    <td className="px-3.5 py-3 font-semibold text-slate-900">{item.userName}</td>
                    <td className="px-3.5 py-3 text-slate-700">{item.pointsSpent}</td>
                    <td className="px-3.5 py-3 text-slate-700">{item.description}</td>
                    <td className="px-3.5 py-3 text-slate-700">{new Date(item.createdAt).toLocaleString("es-AR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[26px] bg-white p-5 shadow-2xl lg:p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold">Registrar canje</h2>
              <button className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm" onClick={() => setOpen(false)} type="button">
                Cerrar
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <button className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-left text-sm" onClick={() => setPlayerPickerOpen(true)} type="button">
                {selectedUser ? `${selectedUser.label} - Vigente: ${selectedUser.scoreVigente}` : "Seleccionar jugador"}
              </button>

              <input className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" type="number" min={1} value={form.pointsSpent} onChange={(event) => setForm((current) => ({ ...current, pointsSpent: Number(event.target.value) }))} placeholder="Puntos" />
              <input className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Descripción" />

              {message ? <p className="text-sm text-slate-600">{message}</p> : null}

              <button className="rounded-xl bg-[#0c7d69] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">
                {saving ? "Registrando..." : "Registrar canje"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {playerPickerOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[26px] bg-white p-5 shadow-2xl lg:p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold">Seleccionar jugador</h2>
              <button className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm" onClick={() => setPlayerPickerOpen(false)} type="button">
                Cerrar
              </button>
            </div>

            <input
              className="mt-5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
              placeholder="Buscar jugador"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
            />

            <div className="mt-5 space-y-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <button className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-left text-sm" key={user.id} onClick={() => handleSelectUser(user)} type="button">
                    <span className="block font-semibold text-slate-900">{user.label}</span>
                    <span className="mt-1 block text-slate-500">Score vigente: {user.scoreVigente}</span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-500">Sin resultados</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
