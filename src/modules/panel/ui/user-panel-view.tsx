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

export function UserPanelView({ user }: { user: UserPanelPayload }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">City Gol</p>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Mi panel</h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Bienvenido, {user.firstName} {user.lastName}.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-slate-500">Score total</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{user.scores.total}</p>
        </article>

        <article className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-slate-500">Score mensual</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{user.scores.monthly}</p>
        </article>

        <article className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-slate-500">Score vigente</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{user.scores.vigente}</p>
        </article>
      </section>

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

            <div>
              <dt className="text-sm font-medium text-slate-500">Rol</dt>
              <dd className="mt-1 text-base capitalize text-slate-900">{user.role}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold">Mi equipo</h2>
          {user.team ? (
            <div className="mt-6 space-y-3">
              <p className="text-lg font-semibold text-slate-900">{user.team.name}</p>
              <p className="text-sm text-slate-600">{user.team.isOwner ? "Sos owner del equipo" : "Miembro del equipo"}</p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-600">Todavia no estas asociado a un equipo.</p>
          )}
        </article>
      </section>
    </main>
  );
}
