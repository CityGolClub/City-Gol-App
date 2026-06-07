import { jsonOk } from "@/lib/utils/http";
import fields from "@mocks/fields.json";

export async function GET() {
  return jsonOk(fields.filter((field) => field.isActive));
}
