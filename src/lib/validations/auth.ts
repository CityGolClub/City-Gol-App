import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email(),
  phone: z.string().trim().min(6),
});
