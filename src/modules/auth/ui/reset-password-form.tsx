"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hashParams, setHashParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    setHashParams(new URLSearchParams(hash));
  }, []);

  const accessToken = useMemo(() => searchParams.get("access_token") ?? hashParams?.get("access_token") ?? "", [hashParams, searchParams]);
  const refreshToken = useMemo(() => searchParams.get("refresh_token") ?? hashParams?.get("refresh_token") ?? "", [hashParams, searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken, refreshToken, password }),
      });

      const payload = await readJsonResponse(response);

      if (!response.ok) {
        setError(getErrorMessage(payload, "No pudimos actualizar la contrasena"));
        return;
      }

      setSuccess("Contrasena actualizada");
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch {
      setError("No pudimos actualizar la contrasena");
    } finally {
      setSubmitting(false);
    }
  }

  const missingTokens = !accessToken || !refreshToken;

    return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-500" htmlFor="reset-password">
          Nueva contraseña
        </label>
        <input
          id="reset-password"
          className="block w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-200 placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-700 sm:text-sm/6"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={missingTokens}
        />
      </div>

      {missingTokens ? <p className="text-sm text-red-600">No encontramos los datos del enlace de recuperación.</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <button
        type="submit"
        disabled={submitting || missingTokens}
        className="flex w-full justify-center rounded-2xl bg-cyan-700 px-3 py-2 text-sm/6 font-semibold text-white transition hover:bg-cyan-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
      >
        {submitting ? "Actualizando..." : "Guardar nueva contraseña"}
      </button>
    </form>
  );
}
