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
    <form className="flex flex-col gap-2 font-Citigol" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-Citigol" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          className="block w-full border-2 border-gray-300 rounded-md bg-white/5 px-3 py-1.5 text-base text-black outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6 font-Citigol"
          placeholder="Escribe tu mail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-Citigol" htmlFor="login-password">
          Contraseña
        </label>
        <input
          id="login-password"
          className="block w-full border-2 border-gray-300 rounded-md bg-black/5 px-3 py-1.5 text-base text-black outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6 font-Citigol"
          placeholder="Escribe tu contraseña"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <div className="flex justify-between items-center text-sm font-Citigol">
        <a href={forgotPasswordHref} className="font-Citigol text-indigo-200 hover:text-teal-600">
          ¿Olvidaste tu contraseña?
        </a>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div>
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full justify-center rounded-md bg-teal-600 px-3 py-1.5 text-sm/6 font-semibold font-Citigol text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
          {submitting ? "Ingresando..." : "Iniciar sesion"}
        </button>
        <p className="mt-2 font-Citigol text-center text-sm/6 text-400">
          ¿No tienes cuenta?{' '}
          <a className="font-semibold text-teal-600 hover:text-teal-00" href={registerHref}>
            Registrate
          </a>
        </p>
      </div>
    </form>
  );
}
