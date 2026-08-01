import { ForgotPasswordForm } from "@/modules/auth/ui/forgot-password-form";
import LogoCitygol from "../../../imgs/Logo-Citygol.png"

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams;

  return (
    <main className="w-full h-full px-[8vw] scroll-auto
      py-[6vw] bg-cover bg-center flex flex-col items-center
      bg-[linear-gradient(rgba(46,82,80,0.8),rgba(23,124,119,0.8))]">
      <img className="h-30 w-23"src={LogoCitygol.src} alt="Citygol Logo" />
      <section className="space-y-4 w-full max-w-[500px] bg-white rounded-lg flex flex-col p-10 shadow-[0_4px_8px_rgba(0,0,0,0.1)] mb-5">
        <h1 className="mt-4 text-2xl font-bold">Recuperar contraseña</h1>
        <p className="mt-3 text-slate-600">Ingresa tu email para recibir el enlace de recuperacion.</p>
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <ForgotPasswordForm
            redirect={redirect}
            />
        </div>
      </section>
    </main>
  );
}
