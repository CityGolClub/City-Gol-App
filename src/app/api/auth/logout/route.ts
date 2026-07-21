import { clearSession } from "@/lib/auth/session";
import { jsonOk } from "@/lib/utils/http";

export async function POST() {
  await clearSession();
  return jsonOk({ success: true });
}
