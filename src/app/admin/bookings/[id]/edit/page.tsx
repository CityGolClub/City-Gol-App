import { AdminBookingFormPage } from "@/modules/admin/ui/admin-booking-form-page";

export default async function AdminEditBookingRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <AdminBookingFormPage bookingId={id} />;
}
