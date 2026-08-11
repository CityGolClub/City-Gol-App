import { LoginForm } from "@/modules/auth/ui/login-form";
import LogoCitygol from "../../../imgs/Logo-Citygol.png"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams;
  const registerHref = redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register";
  const forgotPasswordHref = redirect ? `/forgot-password?redirect=${encodeURIComponent(redirect)}` : "/forgot-password";
  return (
      <main className="w-full h-full px-[8vw] scroll-auto
      py-[6vw] bg-cover bg-center flex flex-col items-center
      bg-[linear-gradient(rgba(46,82,80,0.8),rgba(23,124,119,0.8))]">
        <img className="h-30 w-23"src={LogoCitygol.src} alt="Citygol Logo" />
      <section className="space-y-4 w-full max-w-[500px] bg-white rounded-lg flex flex-col p-10 shadow-[0_4px_8px_rgba(0,0,0,0.1)] mb-5">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <LoginForm redirect={redirect} registerHref={registerHref} forgotPasswordHref={forgotPasswordHref}/>
        </div>

      </section>
    </main>
  );
}
