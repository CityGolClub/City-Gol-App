import { getActiveFields } from "@/lib/fields";
import { jsonOk } from "@/lib/utils/http";

export async function GET() {
  const items = await getActiveFields();
  return jsonOk(items);
}
