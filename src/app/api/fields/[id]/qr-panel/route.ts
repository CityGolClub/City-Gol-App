import { jsonError, jsonOk } from "@/lib/utils/http";
import qrPanelField1 from "@mocks/qr-panel-field-1.json";
import qrPanelField2 from "@mocks/qr-panel-field-2.json";

const panels = {
  field_1: qrPanelField1,
  field_2: qrPanelField2,
} as const;

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const panel = panels[id as keyof typeof panels];

  if (!panel) {
    return jsonError("Cancha no encontrada", 404);
  }

  return jsonOk(panel);
}
