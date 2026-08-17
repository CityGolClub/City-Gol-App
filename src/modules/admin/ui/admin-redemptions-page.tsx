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
    setForm({ userId: "", pointsSpent: 1, description: "" });
    await loadRedemptions();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div>
          <h1 className="text-4xl font-bold">Canjes</h1>
          <p className="mt-3 text-base text-slate-600">Registra y consulta canjes de score vigente.</p>
        </div>

        <button className="rounded-2xl bg-[#0c7d69] px-4 py-3 text-sm font-semibold text-white" onClick={() => setOpen(true)} type="button">
          Registrar canje
        </button>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-5">
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm sm:max-w-sm"
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
              <thead className="bg-[#f2f5ff] text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="rounded-l-2xl px-4 py-4">Jugador</th>
                  <th className="px-4 py-4">Puntos</th>
                  <th className="px-4 py-4">Descripción</th>
                  <th className="rounded-r-2xl px-4 py-4">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr className="border-b border-slate-100" key={item.id}>
                    <td className="px-4 py-4 font-semibold text-slate-900">{item.userName}</td>
                    <td className="px-4 py-4 text-slate-700">{item.pointsSpent}</td>
                    <td className="px-4 py-4 text-slate-700">{item.description}</td>
                    <td className="px-4 py-4 text-slate-700">{new Date(item.createdAt).toLocaleString("es-AR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-bold">Registrar canje</h2>
              <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" onClick={() => setOpen(false)} type="button">
                Cerrar
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <input
                className="rounded-2xl border border-slate-200 px-4 py-3"
                placeholder="Buscar persona"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
              />

              <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.userId} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}>
                <option value="">Selecciona un jugador</option>
                {filteredUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.label} - Vigente: {user.scoreVigente}
                  </option>
                ))}
              </select>

              <input className="rounded-2xl border border-slate-200 px-4 py-3" type="number" min={1} value={form.pointsSpent} onChange={(event) => setForm((current) => ({ ...current, pointsSpent: Number(event.target.value) }))} placeholder="Puntos" />
              <input className="rounded-2xl border border-slate-200 px-4 py-3" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Descripción" />

              {message ? <p className="text-sm text-slate-600">{message}</p> : null}

              <button className="rounded-2xl bg-[#0c7d69] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">
                {saving ? "Registrando..." : "Registrar canje"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
