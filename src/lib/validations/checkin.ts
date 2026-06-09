import { z } from "zod";

export const checkinConfirmSchema = z.object({
  qrToken: z.string().trim().min(1),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6),
  birthDate: z.string().trim().min(1),
});
