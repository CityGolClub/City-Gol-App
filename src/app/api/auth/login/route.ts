import { NextRequest } from "next/server";

import { createSession } from "@/lib/auth/session";
import { loginWithPassword } from "@/lib/auth/supabase-auth";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Los datos ingresados no son validos", 400);
  }

  const { email, password } = parsed.data;
  const result = await loginWithPassword(email, password);

  if (!result.success) {
    return jsonError(result.message, result.status);
  }

  await createSession(result.profile.id);

  return jsonOk({
    success: true,
    redirect: parsed.data.redirect ?? null,
    user: {
      id: result.profile.id,
      firstName: result.profile.firstName,
      lastName: result.profile.lastName,
      email: result.profile.email,
      phone: result.profile.phone,
      role: result.profile.role,
    },
  });
}
