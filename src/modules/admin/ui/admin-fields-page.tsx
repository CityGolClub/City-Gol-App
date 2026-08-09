"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

type FieldItem = {
  id: string;
  name: string;
  slug: string;
  fieldType: "futbol5" | "futbol8";
  defaultCheckinLimit: number;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
};

type FieldFormState = {
  id?: string;
  name: string;
  slug: string;
  fieldType: "futbol5" | "futbol8";
  defaultCheckinLimit: number;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
};

const emptyField: FieldFormState = {
  name: "",
  slug: "",
  fieldType: "futbol5",
  defaultCheckinLimit: 10,
  imageUrl: "",
  displayOrder: 0,
  isActive: true,
};

export function AdminFieldsPage() {
  const [items, setItems] = useState<FieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<FieldFormState | null>(null);
  const [saving, setSaving] = useState(false);

  const loadFields = useMemo(
    () => async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/fields", { cache: "no-store" });
        const payload = await readJsonResponse(response);

        if (!response.ok) {
          setError(getErrorMessage(payload, "No pudimos cargar las canchas"));
          setItems([]);
          return;
        }

        setItems(Array.isArray(payload?.items) ? payload.items : []);
      } catch {
        setError("No pudimos cargar las canchas");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadFields();
  }, [loadFields]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedField) return;
    setSaving(true);
    setMessage(null);

    try {
      const method = selectedField.id ? "PATCH" : "POST";
      const url = selectedField.id ? `/api/admin/fields/${selectedField.id}` : "/api/admin/fields";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedField),
      });
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        setMessage(getErrorMessage(payload, "No pudimos guardar la cancha"));
        return;
      }

      setMessage("Cancha guardada");
      await loadFields();
    } catch {
      setMessage("No pudimos guardar la cancha");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/admin/fields/${id}`, { method: "DELETE" });
    if (response.ok) {
      await loadFields();
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div>
          <h1 className="text-4xl font-bold">Canchas</h1>
          <p className="mt-3 text-base text-slate-600">Administra las canchas disponibles del complejo.</p>
        </div>

        <button className="rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white" onClick={() => setSelectedField({ ...emptyField })} type="button">
          Nueva cancha
        </button>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
        {loading ? <p className="text-sm text-slate-600">Cargando canchas...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !error ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f2f5ff] text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="rounded-l-2xl px-4 py-4">Cancha</th>
                  <th className="px-4 py-4">Tipo</th>
                  <th className="px-4 py-4">Limite</th>
                  <th className="px-4 py-4">Orden</th>
                  <th className="px-4 py-4">Estado</th>
                  <th className="rounded-r-2xl px-4 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className="border-b border-slate-100" key={item.id}>
                    <td className="px-4 py-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="px-4 py-4 text-slate-700">{item.fieldType}</td>
                    <td className="px-4 py-4 text-slate-700">{item.defaultCheckinLimit}</td>
                    <td className="px-4 py-4 text-slate-700">{item.displayOrder}</td>
                    <td className="px-4 py-4 text-slate-700">{item.isActive ? "Activa" : "Inactiva"}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setSelectedField({ ...item, imageUrl: item.imageUrl ?? "" })} type="button">
                          Editar
                        </button>
                        <button className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600" onClick={() => void handleDelete(item.id)} type="button">
                          Desactivar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {selectedField ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-bold">{selectedField.id ? "Editar cancha" : "Nueva cancha"}</h2>
              <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" onClick={() => setSelectedField(null)} type="button">
                Cerrar
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 px-4 py-3" value={selectedField.name} onChange={(event) => setSelectedField({ ...selectedField, name: event.target.value })} placeholder="Nombre" />
                <input className="rounded-2xl border border-slate-200 px-4 py-3" value={selectedField.slug} onChange={(event) => setSelectedField({ ...selectedField, slug: event.target.value })} placeholder="Slug" />
                <select className="rounded-2xl border border-slate-200 px-4 py-3" value={selectedField.fieldType} onChange={(event) => setSelectedField({ ...selectedField, fieldType: event.target.value as "futbol5" | "futbol8" })}>
                  <option value="futbol5">futbol5</option>
                  <option value="futbol8">futbol8</option>
                </select>
                <input className="rounded-2xl border border-slate-200 px-4 py-3" type="number" value={selectedField.defaultCheckinLimit} onChange={(event) => setSelectedField({ ...selectedField, defaultCheckinLimit: Number(event.target.value) })} placeholder="Limite" />
                <input className="rounded-2xl border border-slate-200 px-4 py-3 sm:col-span-2" value={selectedField.imageUrl} onChange={(event) => setSelectedField({ ...selectedField, imageUrl: event.target.value })} placeholder="URL de imagen" />
                <input className="rounded-2xl border border-slate-200 px-4 py-3" type="number" value={selectedField.displayOrder} onChange={(event) => setSelectedField({ ...selectedField, displayOrder: Number(event.target.value) })} placeholder="Orden" />
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input checked={selectedField.isActive} onChange={(event) => setSelectedField({ ...selectedField, isActive: event.target.checked })} type="checkbox" />
                Cancha activa
              </label>

              {message ? <p className="text-sm text-slate-600">{message}</p> : null}

              <button className="rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">
                {saving ? "Guardando..." : "Guardar cancha"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
