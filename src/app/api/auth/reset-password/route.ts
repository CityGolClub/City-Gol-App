import { NextRequest } from "next/server";

import { updatePasswordWithRecovery } from "@/lib/auth/supabase-auth";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("No pudimos validar el cambio de contrasena", 400);
  }

  const result = await updatePasswordWithRecovery(
    parsed.data.accessToken,
    parsed.data.refreshToken,
    parsed.data.password,
  );

  if (!result.success) {
    return jsonError(result.message, result.status);
  }

  return jsonOk({ success: true, message: "Contrasena actualizada" });
}
