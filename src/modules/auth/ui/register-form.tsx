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
        { key: "password", label: "Password", type: "password" },
      ].map((field) => (
        <div className="flex flex-col gap-2" key={field.key}>
          <label className="text-sm font-medium" htmlFor={`register-${field.key}`}>
            {field.label}
          </label>
          <input
            id={`register-${field.key}`}
            className="rounded-xl border border-slate-300 px-4 py-3"
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

      <button className="rounded-xl bg-cyan-700 px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={submitting} type="submit">
        {submitting ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <a className="text-sm text-slate-600 underline" href={loginHref}>
        Ya tengo cuenta
      </a>
    </form>
  );
}
