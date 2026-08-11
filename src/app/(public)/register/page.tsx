import { RegisterForm } from "@/modules/auth/ui/register-form";
import LogoCitygol from "../../../imgs/Logo-Citygol.png"

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams;

  return ( 
    <main className="w-full h-full px-[8vw] scrooll-auto py-[6vw] bg-cover-full bg-center flex flex-col items-center bg-[linear-gradient(rgba(46,82,80,0.8),rgba(23,124,119,0.8))]">
      <img className="h-30 w-23"src={LogoCitygol.src} alt="Citygol Logo" />
        <section className="space-y-4 w-full max-w-[500px] bg-white rounded-lg flex flex-col p-10 shadow-[0_4px_8px_rgba(0,0,0,0.1)] mb-5">
        <h1 className="font-bold text-2xl">Registrate</h1>
        <p className="text-slate-600">Completa los datos para crear tu cuenta.</p>
        <div className="sm:mx-auto sm:w-full sm:h-full">
        <RegisterForm redirect={redirect} loginHref={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"} />
        </div>
      </section>
    </main>
  );
}
  