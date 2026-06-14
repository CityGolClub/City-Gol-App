import { NextRequest } from "next/server";

import { createSession } from "@/lib/auth/session";
import { registerWithPassword } from "@/lib/auth/supabase-auth";
import { jsonCreated, jsonError } from "@/lib/utils/http";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Completa todos los datos del registro", 400);
  }

  const result = await registerWithPassword(parsed.data);

  if (!result.success) {
    return jsonError(result.message, result.status);
  }

  await createSession(result.profile.id);

  return jsonCreated({
    success: true,
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
