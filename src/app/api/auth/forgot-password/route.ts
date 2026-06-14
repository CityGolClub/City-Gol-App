import { NextRequest } from "next/server";

import { getAppUrl } from "@/lib/env";
import { sendPasswordReset } from "@/lib/auth/supabase-auth";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Ingresa un email valido", 400);
  }

  const redirectTo = `${getAppUrl()}/reset-password`;
  const result = await sendPasswordReset(parsed.data.email, redirectTo);

  if (!result.success) {
    return jsonError(result.message, result.status);
  }

  return jsonOk({ success: true, message: "Te enviamos un mail para recuperar la contrasena" });
}
