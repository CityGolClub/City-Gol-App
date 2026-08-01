import { CheckinFlow } from "@/modules/checkin/ui/checkin-flow";

export default async function CheckinTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return <CheckinFlow token={token} />;
}
