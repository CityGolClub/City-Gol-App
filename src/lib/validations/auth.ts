import { z } from "zod";

const redirectField = z.string().trim().min(1).optional();

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  redirect: redirectField,
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6),
  birthDate: z.string().trim().min(1),
  password: z.string().min(8),
  repeatPassword: z.string().min(8),
  redirect: redirectField,
}).refine((data) => data.password === data.repeatPassword, {
  message: "Las contrasenas no coinciden",
  path: ["repeatPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
  redirect: redirectField,
});

export const resetPasswordSchema = z.object({
  accessToken: z.string().trim().min(1),
  refreshToken: z.string().trim().min(1),
  password: z.string().min(8),
});
