"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

type FieldItem = {
  id: string;
  name: string;
  slug: string;
  fieldType: string;
  defaultCheckinLimit: number;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
};

export function FieldSelector() {
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFields() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/fields", { cache: "no-store" });
        const payload = await readJsonResponse(response);

        if (!response.ok) {
          if (active) {
            setError(getErrorMessage(payload, "No pudimos cargar las canchas"));
            setFields([]);
          }
          return;
        }

        if (active) {
          setFields(Array.isArray(payload) ? (payload as FieldItem[]) : []);
        }
      } catch {
        if (active) {
          setError("No pudimos cargar las canchas");
          setFields([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFields();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-12">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">City Gol</p>
        <h1 className="mt-4 text-4xl font-bold">Selecciona tu Cancha para Iniciar</h1>
        <p className="mt-3 text-slate-600">Elegí una de nuestras canchas para mostrar los QR visibles del turno.</p>
      </section>

      {loading ? <p className="text-slate-600">Cargando canchas...</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      {!loading && !error && fields.length === 0 ? (
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-slate-600">No hay canchas activas para mostrar.</p>
        </section>
      ) : null}

      {fields.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {fields.map((field) => (
            <Link
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-cyan-300 hover:shadow-md"
              href={`/qr/${field.id}`}
              key={field.id}
            >
              <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                {field.imageUrl ? (
                  <img alt={field.name} className="h-full w-full object-cover transition group-hover:scale-[1.02]" src={field.imageUrl} />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">Sin imagen</div>
                )}
              </div>

              <div className="p-5">
                <p className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800">
                  {field.fieldType}
                </p>
                <h2 className="mt-3 text-2xl font-bold">{field.name}</h2>
                <p className="mt-2 text-sm text-slate-600">Limite default: {field.defaultCheckinLimit}</p>
              </div>
            </Link>
          ))}
        </section>
      ) : null}
    </main>
  );
}
