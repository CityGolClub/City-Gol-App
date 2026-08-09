"use client";

import { useEffect, useState } from "react";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

type TeamItem = {
  id: string;
  name: string;
  isActive: boolean;
  owner: {
    id: string;
    fullName: string;
  };
  memberCount: number;
};

export function AdminTeamsPage() {
  const [items, setItems] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/teams", { cache: "no-store" });
        const payload = await readJsonResponse(response);

        if (!response.ok) {
          if (active) {
            setError(getErrorMessage(payload, "No pudimos cargar los equipos"));
            setItems([]);
          }
          return;
        }

        if (active) {
          setItems(Array.isArray(payload?.items) ? payload.items : []);
        }
      } catch {
        if (active) {
          setError("No pudimos cargar los equipos");
          setItems([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTeams();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
        <h1 className="text-4xl font-bold">Equipos</h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600">Listado simple de equipos activos y su owner.</p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
        {loading ? <p className="text-sm text-slate-600">Cargando equipos...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !error ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f2f5ff] text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="rounded-l-2xl px-4 py-4">Equipo</th>
                  <th className="px-4 py-4">Owner</th>
                  <th className="rounded-r-2xl px-4 py-4">Miembros</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className="border-b border-slate-100" key={item.id}>
                    <td className="px-4 py-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="px-4 py-4 text-slate-700">{item.owner.fullName}</td>
                    <td className="px-4 py-4 text-slate-700">{item.memberCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
