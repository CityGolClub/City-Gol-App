"use client";

import { FormEvent, useState } from "react";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";

type ForgotPasswordFormProps = {
  redirect?: string;
};

export function ForgotPasswordForm({ redirect }: ForgotPasswordFormProps) {
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
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="forgot-email">
          Email
        </label>
        <input
          id="forgot-email"
          className="rounded-xl border border-slate-300 px-4 py-3"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <button className="rounded-xl bg-cyan-700 px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={submitting} type="submit">
        {submitting ? "Enviando..." : "Enviar mail de recuperacion"}
      </button>
    </form>
  );
}
