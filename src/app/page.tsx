const cards = [
  "Auth email + password",
  "Fields selector",
  "QR panel por cancha",
  "Usuario autenticado",
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">City Gol</p>
        <h1 className="mt-4 text-4xl font-bold">Base inicial de backend y contratos</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Esta base deja lista la estructura del proyecto, el schema de Drizzle, mocks oficiales y los primeros endpoints para
          que frontend y backend trabajen en paralelo.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <article key={card} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{card}</h2>
          </article>
        ))}
      </section>
    </main>
  );
}
