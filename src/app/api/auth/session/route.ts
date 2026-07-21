import { getSessionUserId } from "@/lib/auth/session";
import { getUserPanelPayload } from "@/lib/users/panel";
import { jsonOk } from "@/lib/utils/http";

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return jsonOk({ authenticated: false });
  }

  const panel = await getUserPanelPayload(userId);

  if (!panel) {
    return jsonOk({ authenticated: false });
  }

  return jsonOk({
    authenticated: true,
    user: {
      id: panel.id,
      firstName: panel.firstName,
      lastName: panel.lastName,
      email: panel.email,
      role: panel.role,
    },
    panel,
  });
}
