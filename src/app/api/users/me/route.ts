import { getSessionUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/utils/http";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return jsonError("No hay una sesion activa", 401);
  }

  return jsonOk({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    birthDate: user.birthDate,
    role: user.role,
    team: user.team,
    scores: user.scores,
  });
}
