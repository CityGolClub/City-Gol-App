"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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

type TeamSearchItem = {
  id: string;
  name: string;
  ownerName: string;
  memberCount: number;
};

type TeamJoinRequestItem = {
  id: string;
  teamId: string;
  teamName: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  createdAt: string;
};

export function UserPanelPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserPanelPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [searchResults, setSearchResults] = useState<TeamSearchItem[]>([]);
  const [joinRequests, setJoinRequests] = useState<TeamJoinRequestItem[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const loadTeamSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      const response = await fetch(`/api/teams?q=${encodeURIComponent(query.trim())}`, { cache: "no-store" });
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        setSearchResults([]);
        return;
      }

      setSearchResults(Array.isArray(payload) ? payload : []);
    },
    [],
  );

  const loadJoinRequests = useCallback(async (teamId: string, isOwner: boolean) => {
    if (!isOwner) {
      setJoinRequests([]);
      return;
    }

    const response = await fetch(`/api/teams/${teamId}/join-requests`, { cache: "no-store" });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      setJoinRequests([]);
      return;
    }

    setJoinRequests(Array.isArray(payload) ? payload : []);
  }, []);

  const loadPanel = useCallback(async () => {
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
        setError(getErrorMessage(payload, "No pudimos cargar tu panel"));
        setUser(null);
        return;
      }

      const panel = payload as UserPanelPayload;
      setUser(panel);
      if (panel.team) {
        await loadJoinRequests(panel.team.id, panel.team.isOwner);
      } else {
        setJoinRequests([]);
      }
    } catch {
      setError("No pudimos cargar tu panel");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [loadJoinRequests, router]);

  useEffect(() => {
    void loadPanel();
  }, [loadPanel]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadTeamSearch(teamSearch);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [teamSearch, loadTeamSearch]);

  async function handleCreateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionLoading(true);
    setMessage(null);

    const response = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: teamName }),
    });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      setMessage(getErrorMessage(payload, "No pudimos crear el equipo"));
      setActionLoading(false);
      return;
    }

    setTeamName("");
    setMessage("Equipo creado");
    setActionLoading(false);
    await loadPanel();
  }

  async function handleJoinRequest(teamId: string) {
    setActionLoading(true);
    setMessage(null);

    const response = await fetch(`/api/teams/${teamId}/join-request`, { method: "POST" });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      setMessage(getErrorMessage(payload, "No pudimos enviar la solicitud"));
      setActionLoading(false);
      return;
    }

    setMessage("Solicitud enviada");
    setActionLoading(false);
  }

  async function handleLeaveTeam(teamId: string) {
    setActionLoading(true);
    setMessage(null);

    const response = await fetch(`/api/teams/${teamId}/leave`, { method: "POST" });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      setMessage(getErrorMessage(payload, "No pudimos salir del equipo"));
      setActionLoading(false);
      return;
    }

    setMessage(payload?.deletedTeam ? "Equipo eliminado" : "Saliste del equipo");
    setActionLoading(false);
    await loadPanel();
  }

  async function handleDeleteTeam(teamId: string) {
    setActionLoading(true);
    setMessage(null);

    const response = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      setMessage(getErrorMessage(payload, "No pudimos eliminar el equipo"));
      setActionLoading(false);
      return;
    }

    setMessage("Equipo eliminado");
    setActionLoading(false);
    await loadPanel();
  }

  async function handleRequestDecision(teamId: string, requestId: string, action: "accept" | "reject") {
    setActionLoading(true);
    setMessage(null);

    const response = await fetch(`/api/teams/${teamId}/join-requests/${requestId}/${action}`, { method: "POST" });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      setMessage(getErrorMessage(payload, "No pudimos procesar la solicitud"));
      setActionLoading(false);
      return;
    }

    setMessage(action === "accept" ? "Solicitud aceptada" : "Solicitud rechazada");
    setActionLoading(false);
    await loadPanel();
  }

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

  return (
    <UserPanelView
      actionLoading={actionLoading}
      joinRequests={joinRequests}
      message={message}
      onAcceptRequest={(teamId, requestId) => void handleRequestDecision(teamId, requestId, "accept")}
      onCreateTeam={handleCreateTeam}
      onDeleteTeam={(teamId) => void handleDeleteTeam(teamId)}
      onJoinRequest={(teamId) => void handleJoinRequest(teamId)}
      onLeaveTeam={(teamId) => void handleLeaveTeam(teamId)}
      onRejectRequest={(teamId, requestId) => void handleRequestDecision(teamId, requestId, "reject")}
      onSearchChange={setTeamSearch}
      searchResults={searchResults}
      teamName={teamName}
      teamSearch={teamSearch}
      user={user}
      setTeamName={setTeamName}
    />
  );
}
