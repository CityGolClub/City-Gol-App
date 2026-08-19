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
    <main className="h-[100dvh] overflow-hidden bg-[#f6f8ff] px-4 py-5 text-slate-900 sm:px-6 sm:py-6 lg:px-10 lg:py-6">
      <div className="mx-auto flex h-full max-w-7xl flex-col">
        <header>
          <p className="text-2xl font-bold text-cyan-700">City Gol</p>
          <h1 className="mt-6 text-[clamp(1.8rem,3.4vw,2.9rem)] font-bold leading-tight">Selecciona tu Cancha para Iniciar</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">Elegí una de nuestras canchas de fútbol para comenzar el chek-in.</p>
        </header>

        {loading ? <p className="mt-6 text-slate-600">Cargando canchas...</p> : null}
        {error ? <p className="mt-6 text-red-600">{error}</p> : null}

        {!loading && !error && fields.length === 0 ? (
          <section className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-slate-600">No hay canchas activas para mostrar.</p>
          </section>
        ) : null}

        {fields.length > 0 ? (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => (
              <Link
                className="group relative overflow-hidden rounded-[22px] bg-slate-900 shadow-[0_18px_40px_rgba(18,35,61,0.12)] transition duration-200 hover:-translate-y-0.5"
                href={`/qr/${field.id}`}
                key={field.id}
              >
                <div className="aspect-[1.45/1] overflow-hidden bg-slate-950 sm:aspect-[1.5/1]">
                  {field.imageUrl ? (
                    <img alt={field.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" src={field.imageUrl} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">Sin imagen</div>
                  )}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/18 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                  <p className="inline-flex rounded-full bg-cyan-700/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-sm sm:text-[11px]">
                    {field.fieldType === "futbol5" ? "FOOTBALL 5" : "FOOTBALL 8"}
                  </p>
                  <h2 className="mt-3 text-[clamp(1.7rem,2vw,2.2rem)] font-bold leading-none drop-shadow-sm">{field.name}</h2>
                </div>
              </Link>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
