import { z } from "zod";

export const checkinConfirmSchema = z.object({
  qrToken: z.string().trim().min(1),
});
