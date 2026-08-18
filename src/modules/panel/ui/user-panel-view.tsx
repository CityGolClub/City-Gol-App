import { FormEventHandler } from "react";

import { LogoutButton } from "@/components/logout-button";

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

function formatBirthDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function UserPanelView({
  user,
  teamName,
  setTeamName,
  onCreateTeam,
  teamSearch,
  onSearchChange,
  searchResults,
  teamPopup,
  onCloseTeamPopup,
  onJoinRequest,
  onLeaveTeam,
  onDeleteTeam,
  joinRequests,
  onAcceptRequest,
  onRejectRequest,
  actionLoading,
  message,
}: {
  user: UserPanelPayload;
  teamName: string;
  setTeamName: (value: string) => void;
  onCreateTeam: FormEventHandler<HTMLFormElement>;
  teamSearch: string;
  onSearchChange: (value: string) => void;
  searchResults: TeamSearchItem[];
  teamPopup: { title: string; message: string } | null;
  onCloseTeamPopup: () => void;
  onJoinRequest: (teamId: string) => void;
  onLeaveTeam: (teamId: string) => void;
  onDeleteTeam: (teamId: string) => void;
  joinRequests: TeamJoinRequestItem[];
  onAcceptRequest: (teamId: string, requestId: string) => void;
  onRejectRequest: (teamId: string, requestId: string) => void;
  actionLoading: boolean;
  message: string | null;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      {teamPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6">
          <section className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl sm:p-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#0c7d69] text-4xl text-white">✓</div>
            <h2 className="mt-6 text-center text-2xl font-bold text-[#0c7d69]">{teamPopup.title}</h2>
            <p className="mt-4 text-center text-base leading-7 text-slate-700">{teamPopup.message}</p>
            <button className="mt-6 w-full rounded-2xl bg-[#0c7d69] px-4 py-3 font-semibold text-white" onClick={onCloseTeamPopup} type="button">
              Entendido
            </button>
          </section>
        </div>
      ) : null}

      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">City Gol</p>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Mi panel</h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Bienvenido, {user.firstName} {user.lastName}.
            </p>
          </div>

          <LogoutButton className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-slate-50" />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4">
        <article className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-slate-500">Score mensual</p>
          <p className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{user.scores.monthly}</p>
        </article>

        <article className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-slate-500">Score vigente</p>
          <p className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{user.scores.vigente}</p>
        </article>
      </section>

      {message ? <section className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">{message}</section> : null}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold">Mis datos</h2>

          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">Nombre</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">{user.firstName}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-500">Apellido</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">{user.lastName}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-500">Email</dt>
              <dd className="mt-1 break-all text-base text-slate-900">{user.email}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-500">Telefono</dt>
              <dd className="mt-1 text-base text-slate-900">{user.phone}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-500">Fecha de nacimiento</dt>
              <dd className="mt-1 text-base text-slate-900">{formatBirthDate(user.birthDate)}</dd>
            </div>

          </dl>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold">Mi equipo</h2>
          {user.team ? (
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-lg font-semibold text-slate-900">{user.team.name}</p>
                <p className="text-sm text-slate-600">{user.team.isOwner ? "Sos owner del equipo" : "Miembro del equipo"}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {user.team.isOwner ? (
                  <button className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600" disabled={actionLoading} onClick={() => onDeleteTeam(user.team!.id)} type="button">
                    Eliminar equipo
                  </button>
                ) : (
                  <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" disabled={actionLoading} onClick={() => onLeaveTeam(user.team!.id)} type="button">
                    Dejar equipo
                  </button>
                )}
              </div>

              {user.team.isOwner ? (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Solicitudes pendientes</h3>
                  {joinRequests.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {joinRequests.map((request) => (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4" key={request.id}>
                          <p className="font-semibold text-slate-900">
                            {request.user.firstName} {request.user.lastName}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">{request.user.email}</p>
                          <p className="mt-1 text-sm text-slate-500">{request.user.phone}</p>
                          <div className="mt-3 flex gap-2">
                            <button className="rounded-xl bg-[#0c7d69] px-3 py-2 text-sm font-semibold text-white" disabled={actionLoading} onClick={() => onAcceptRequest(request.teamId, request.id)} type="button">
                              Aceptar
                            </button>
                            <button className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600" disabled={actionLoading} onClick={() => onRejectRequest(request.teamId, request.id)} type="button">
                              Rechazar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">No hay solicitudes pendientes.</p>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <form className="space-y-3" onSubmit={onCreateTeam}>
                <h3 className="text-lg font-semibold">Crear equipo</h3>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  placeholder="Nombre del equipo"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  required
                />
                <button className="rounded-2xl bg-[#0c7d69] px-4 py-3 text-sm font-semibold text-white" disabled={actionLoading} type="submit">
                  Crear equipo
                </button>
              </form>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Buscar equipo</h3>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  placeholder="Buscar por nombre"
                  value={teamSearch}
                  onChange={(event) => onSearchChange(event.target.value)}
                />

                {searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map((team) => (
                      <div className="rounded-2xl border border-slate-200 p-4" key={team.id}>
                        <p className="font-semibold text-slate-900">{team.name}</p>
                        <p className="mt-1 text-sm text-slate-500">Owner: {team.ownerName}</p>
                        <p className="mt-1 text-sm text-slate-500">Miembros: {team.memberCount}</p>
                        <button className="mt-3 rounded-xl bg-[#0c7d69] px-3 py-2 text-sm font-semibold text-white" disabled={actionLoading} onClick={() => onJoinRequest(team.id)} type="button">
                          Solicitar unirme
                        </button>
                      </div>
                    ))}
                  </div>
                ) : teamSearch.trim() ? (
                  <p className="text-sm text-slate-500">No encontramos equipos con ese nombre.</p>
                ) : null}
              </div>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
