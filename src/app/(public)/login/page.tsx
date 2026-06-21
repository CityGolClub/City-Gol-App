import { LoginForm } from "@/modules/auth/ui/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams;
  const registerHref = redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register";
  const forgotPasswordHref = redirect ? `/forgot-password?redirect=${encodeURIComponent(redirect)}` : "/forgot-password";

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">City Gol</p>
        <h1 className="mt-4 text-3xl font-bold">Login MVP</h1>
        <p className="mt-3 text-slate-600">Inicia sesion para continuar con tu check-in o entrar a tu panel.</p>
        <div className="mt-6">
          <LoginForm redirect={redirect} registerHref={registerHref} forgotPasswordHref={forgotPasswordHref} />
        </div>
      </section>
    </main>
  );
}
