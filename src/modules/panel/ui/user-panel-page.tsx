"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getErrorMessage, readJsonResponse } from "@/modules/auth/ui/auth-helpers";
import { UserPanelView } from "@/modules/panel/ui/user-panel-view";

type UserPanelPayload = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  role: string;
  team: {
    id: string;
    name: string;
    isOwner: boolean;
  } | null;
  scores: {
    total: number;
    monthly: number;
    vigente: number;
  };
};

export function UserPanelPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserPanelPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPanel() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/users/me", { cache: "no-store" });
        const payload = await readJsonResponse(response);

        if (response.status === 401) {
          router.replace("/login?redirect=/panel");
          return;
        }

        if (!response.ok) {
          if (active) {
            setError(getErrorMessage(payload, "No pudimos cargar tu panel"));
            setUser(null);
          }
          return;
        }

        if (active) {
          setUser(payload as UserPanelPayload);
        }
      } catch {
        if (active) {
          setError("No pudimos cargar tu panel");
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPanel();

    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
        <div className="rounded-3xl bg-white px-6 py-8 text-sm text-slate-600 shadow-sm sm:px-8">Cargando panel...</div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
        <div className="rounded-3xl bg-white px-6 py-8 text-sm text-red-600 shadow-sm sm:px-8">{error ?? "No pudimos cargar tu panel"}</div>
      </main>
    );
  }

  return <UserPanelView user={user} />;
}
