export default function UserPanelPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl px-6 py-12">
      <section className="w-full rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Panel de usuario</h1>
        <p className="mt-3 text-slate-600">Base del panel autenticado para integrar con `GET /api/users/me`.</p>
      </section>
    </main>
  );
}
