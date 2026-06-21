"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

type LoginFormProps = {
  redirect?: string;
  onSuccess?: () => void;
  registerHref?: string;
  forgotPasswordHref?: string;
};

export function LoginForm({ redirect, onSuccess, registerHref = "/register", forgotPasswordHref = "/forgot-password" }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, redirect }),
      });

      const payload = await readJsonResponse(response);

      if (!response.ok) {
        setError(getErrorMessage(payload, "No pudimos iniciar sesion"));
        return;
      }

      if (onSuccess) {
        await onSuccess();
      } else {
        router.push((payload && typeof payload === "object" && "redirect" in payload && typeof payload.redirect === "string" && payload.redirect) || redirect || "/panel");
        router.refresh();
      }
    } catch {
      setError("No pudimos iniciar sesion");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          className="rounded-xl border border-slate-300 px-4 py-3"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          className="rounded-xl border border-slate-300 px-4 py-3"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button className="rounded-xl bg-cyan-700 px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={submitting} type="submit">
        {submitting ? "Ingresando..." : "Iniciar sesion"}
      </button>

      <div className="flex flex-col gap-2 text-sm text-slate-600">
        <a className="underline" href={registerHref}>
          Crear cuenta
        </a>
        <a className="underline" href={forgotPasswordHref}>
          Olvide mi contrasena
        </a>
      </div>
    </form>
  );
}
