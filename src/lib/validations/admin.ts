import { z } from "zod";

export const adminUserUpdateSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6),
  birthDate: z.string().trim().min(1),
  role: z.enum(["user", "admin"]),
  isActive: z.boolean(),
});

export const scoreAdjustmentSchema = z.object({
  scoreType: z.enum(["total", "monthly", "vigente"]),
  delta: z.coerce.number().int().refine((value) => value !== 0, {
    message: "El ajuste no puede ser 0",
  }),
  reason: z.string().trim().min(1),
});

export const adminFieldSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  fieldType: z.enum(["futbol5", "futbol8"]),
  defaultCheckinLimit: z.coerce.number().int().min(1),
  imageUrl: z.string().trim().url().or(z.literal("")),
  displayOrder: z.coerce.number().int().min(0),
  isActive: z.boolean(),
});

export const adminSettingsSchema = z.object({
  bookingDurationMinutes: z.coerce.number().int().min(1),
  graceMinutes: z.coerce.number().int().min(0).max(30),
});
