"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

type RegisterFormProps = {
  redirect?: string;
  loginHref?: string;
};

export function RegisterForm({ redirect, loginHref = "/login" }: RegisterFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
      {[
        { key: "firstName", label: "Nombre", type: "text" },
        { key: "lastName", label: "Apellido", type: "text" },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Telefono", type: "tel" },
        { key: "birthDate", label: "Fecha de nacimiento", type: "date" },
        { key: "password", label: "Contraseña", type: "password" },
        { key: "repeatPassword", label: "Confirmar Contraseña", type: "password" },
      ].map((field) => (
        <div className="flex w-full min-w-0 flex-col" key={field.key}>
          <label className="text-sm font-sm font-Citigol" htmlFor={`register-${field.key}`}>
            {field.label}
          </label>
          <input
            id={`register-${field.key}`}
            className={`block w-full min-w-0 max-w-full rounded-md border-2 border-gray-300 bg-white/5 px-3 py-1.5 text-base text-black outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6 font-Citigol ${field.type === "date" ? "appearance-none pr-3" : ""}`}
            type={field.type}
            value={form[field.key as keyof typeof form]}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                [field.key]: event.target.value,
              }))
            }
            required 
          />
        </div>
      ))}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button className="flex w-full justify-center rounded-md bg-teal-600 px-3 py-1.5 text-sm/6 font-Citigol text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500" type="submit" disabled={submitting}>
        {submitting ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="mt-2 text-center text-sm/6 text-400">
          ¿Ya tienes cuenta?{' '}
          <a className="font-semibold font-Citigol text-indigo-400 hover:text-indigo-300" href={loginHref}>
            Inicia sesion
          </a>
        </p>
    </form>
  );
}
