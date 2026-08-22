"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";
import showPass from "../../../imgs/showPass.png";
import hidePass from "../../../imgs/hidePass.png";

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
  const [showPassword, setShowPassword] = useState(false);
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
        <label className="text-sm font-medium text-slate-500" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          className="block w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-200 placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-700 sm:text-sm/6"
          placeholder="Escribe tu mail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-500" htmlFor="login-password">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="login-password"
            className="block w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-200 placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-700 sm:text-sm/6"
            placeholder="Escribe tu contraseña"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <img
              className={showPassword ? "h-[19px] w-5 object-contain" : "h-5 w-5 object-contain"}
              src={showPassword ? hidePass.src : showPass.src}
              alt={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <a href={forgotPasswordHref} className="text-cyan-700 hover:text-cyan-800">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full justify-center rounded-2xl bg-cyan-700 px-3 py-2 text-sm/6 font-semibold text-white transition hover:bg-cyan-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
        >
          {submitting ? "Ingresando..." : "Iniciar sesión"}
        </button>
        <p className="mt-2 text-center text-sm/6 text-slate-900">
          ¿No tienes cuenta?{" "}
          <a className="font-semibold text-cyan-700 hover:text-cyan-800" href={registerHref}>
            Registrate
          </a>
        </p>
      </div>
    </form>
  );
}
