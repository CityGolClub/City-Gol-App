import { createSupabaseAdminClient, createSupabaseClient } from "@/lib/storage/supabase";
import { createProfileForAuthUser, findActiveUserByAuthUserId, findUsersByEmailOrPhone, RegistrationInput } from "@/lib/users/identity";

export async function registerWithPassword(input: RegistrationInput & { password: string }) {
  const admin = createSupabaseAdminClient();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.replace(/\s+/g, "").trim();

  const existing = await findUsersByEmailOrPhone(email, phone);
  if (existing.length > 0) {
    return { success: false as const, status: 409, message: "Ya existe una cuenta con ese mail o celular" };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
  });

  if (error || !data.user) {
    return { success: false as const, status: 400, message: error?.message ?? "No pudimos crear la cuenta" };
  }

  try {
    const profile = await createProfileForAuthUser(data.user.id, input);
    return { success: true as const, profile, authUserId: data.user.id };
  } catch (error) {
    await admin.auth.admin.deleteUser(data.user.id);

    return {
      success: false as const,
      status: 500,
      message: error instanceof Error ? error.message : "No pudimos crear el perfil del usuario",
    };
  }
}

export async function loginWithPassword(email: string, password: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    return { success: false as const, status: 401, message: "Credenciales invalidas" };
  }

  const profile = await findActiveUserByAuthUserId(data.user.id);

  if (!profile) {
    return { success: false as const, status: 404, message: "No encontramos el perfil de la cuenta" };
  }

  return { success: true as const, profile, authUserId: data.user.id };
}

export async function sendPasswordReset(email: string, redirectTo: string) {
  const supabase = createSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });

  if (error) {
    return { success: false as const, status: 400, message: error.message };
  }

  return { success: true as const };
}

export async function updatePasswordWithRecovery(accessToken: string, refreshToken: string, password: string) {
  const supabase = createSupabaseClient();
  const { error: setSessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });

  if (setSessionError) {
    return { success: false as const, status: 400, message: setSessionError.message };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });

  if (updateError) {
    return { success: false as const, status: 400, message: updateError.message };
  }

  return { success: true as const };
}
