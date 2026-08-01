import { getFieldById, getVisibleBookingsForField } from "@/lib/fields";
import { jsonError, jsonOk } from "@/lib/utils/http";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const field = await getFieldById(id);

  if (!field) {
    return jsonError("Cancha no encontrada", 404);
  }

  const visibleBookings = await getVisibleBookingsForField(field.id);

  return jsonOk({
    field: {
      id: field.id,
      name: field.name,
      fieldType: field.fieldType,
    },
    visibleBookings,
  });
}
