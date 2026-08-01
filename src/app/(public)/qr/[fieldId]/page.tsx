import { FieldQrPanel } from "@/modules/qr/ui/field-qr-panel";

export default async function QrFieldPage({ params }: { params: Promise<{ fieldId: string }> }) {
  const { fieldId } = await params;

  return <FieldQrPanel fieldId={fieldId} />;
}
