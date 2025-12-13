import AffiliatesDashboard from "@/components/affiliates-dashboard";
import { auth } from "@/lib/auth";
import MarketingLayout from "@/components/marketing-layout";

export default async function AffiliateDashboardPage({ params }) {
  const session = await auth();
  const userId = session?.user?.strapiUserId || "";

  const affiliatePath = userId
    ? `?ref=${encodeURIComponent(userId)}`
    : "/dashboard";

  return (
    <MarketingLayout>
      <AffiliatesDashboard affiliatePath={affiliatePath} userId={userId} />
    </MarketingLayout>
  );
}
