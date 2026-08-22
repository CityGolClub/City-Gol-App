"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";
import { required } from "zod/v4-mini";
import showPass from "../../../imgs/showPass.png";
import hidePass from "../../../imgs/hidePass.png";

type RegisterFormProps = {
  redirect?: string;
  loginHref?: string;
};

export function RegisterForm({ redirect, loginHref = "/login" }: RegisterFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    password: "",
    repeatPassword: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...form, redirect }),
      });

      const payload = await readJsonResponse(response);

      if (!response.ok) {
        setError(getErrorMessage(payload, "No pudimos crear la cuenta"));
        return;
      }

      const nextHref = payload && typeof payload === "object" && "redirect" in payload && typeof payload.redirect === "string"
        ? payload.redirect
        : redirect;

      router.push(nextHref || "/panel");
      router.refresh();
    } catch {
      setError("No pudimos crear la cuenta");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {[
        { key: "firstName", label: "Nombre", type: "text" },
        { key: "lastName", label: "Apellido", type: "text" },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Telefono", type: "tel" },
        { key: "birthDate", label: "Fecha de nacimiento", type: "date" },
        { key: "password", label: "Contraseña", type: "password" },
        { key: "repeatPassword", label: "Confirmar Contraseña", type: "password" },
      ].map((field) => (
        <div className="flex flex-col gap-2" key={field.key}>
          <label className="text-sm font-medium text-slate-500" htmlFor={`register-${field.key}`}>
            {field.label}
          </label>
          <div className="relative">
            <input
              id={`register-${field.key}`}
              className="block w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 outline-1 -outline-offset-1 outline-slate-200 placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-700 sm:text-sm/6"
              type={field.type === "password" ? (showPassword ? "text" : field.type) : field.type}
              value={form[field.key as keyof typeof form]}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  [field.key]: event.target.value,
                }))
              }
              required
            />
            {field.type === "password" && (
              <button
                type="button"
                className="absolute right-3 top-1/2 flex h-3 w-5 -translate-y-1/2 cursor-pointer"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <img
                  className="h-3 w-5"
                  src={showPassword ? hidePass.src : showPass.src}
                  alt={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                />
              </button>
            )}
          </div>
        </div>
      ))}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full justify-center rounded-2xl bg-cyan-700 px-3 py-2 text-sm/6 font-semibold text-white transition hover:bg-cyan-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
      >
        {submitting ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="mt-2 text-center text-sm/6 text-slate-900">
        ¿Ya tienes cuenta?{" "}
        <a className="font-semibold text-cyan-700 hover:text-cyan-800" href={loginHref}>
          Inicia sesión
        </a>
      </p>
    </form>
  );
}
