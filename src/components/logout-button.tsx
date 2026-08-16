"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    setSubmitting(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push("/login");
      router.refresh();
      setSubmitting(false);
    }
  }

  return (
    <button className={className} disabled={submitting} onClick={handleLogout} type="button">
      <span aria-hidden="true">↪</span>
      {submitting ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}
