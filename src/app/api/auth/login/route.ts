import { NextRequest } from "next/server";

import { createSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { loginSchema } from "@/lib/validations/auth";
import users from "@mocks/users.json";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Los datos ingresados no son validos", 400);
  }

  const { email, phone } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.replace(/\s+/g, "");

  const user = users.find(
    (candidate) =>
      candidate.email.toLowerCase() === normalizedEmail && candidate.phone.replace(/\s+/g, "") === normalizedPhone,
  );

  if (!user || !user.isActive) {
    return jsonError("No encontramos una cuenta con esos datos", 401);
  }

  await createSession(user.id);

  return jsonOk({
    success: true,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
}
