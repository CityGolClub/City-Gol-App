"use client";

import { FormEvent, useState } from "react";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

type ForgotPasswordFormProps = {
  redirect?: string;
};

export function ForgotPasswordForm({redirect}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, redirect }),
      });

      const payload = await readJsonResponse(response);

      if (!response.ok) {
        setError(getErrorMessage(payload, "No pudimos enviar el mail"));
        return;
      }

      setSuccess("Te enviamos un mail para recuperar la contrasena");
    } catch {
      setError("No pudimos enviar el mail");
    } finally {
      setSubmitting(false);
    }
  }

  return (
   
      <form className="flex flex-col gap-2 scroll-auto" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="forgot-email">
          Email
        </label>
        <input
          id="forgot-email"
          className="block w-full border-2 border-gray-300 rounded-md bg-white/5 px-3 py-1.5 text-base text-black outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-teal-600 sm:text-sm/6"
          type="email"
          placeholder="Ingresa tu email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <button className="flex w-full justify-center rounded-md bg-teal-600 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
        {submitting ? "Enviando..." : "Enviar mail de recuperacion"}
      </button>
      <a className="mt-2 text-center font-semibold text-sm/6 text-400"href={"/login"}>
            Volver
          </a>
      </form>
  );
}
