import AffiliatesDashboard from "@/components/affiliates-dashboard";
import { auth } from "@/lib/auth";
import MarketingLayout from "@/components/marketing-layout";
import { buildStrapiUrl } from "@/lib/strapi";

async function getAffiliateData(token, userId) {
  try {
    // 1. Fetch user data for commission_percent
    const userRes = await fetch(buildStrapiUrl(`/api/users?filters[id][$eq]=${userId}`), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const userData = await userRes.json();
    const commissionPercent = userData[0]?.commission_percent || 0;

    // 2. Fetch referrals
    const qs = new URLSearchParams();
    qs.set("filters[user][id][$eq]", userId);
    qs.set("populate[subscription][populate]", "plan");
    qs.set("sort", "createdAt:desc");
    
    const referalsRes = await fetch(buildStrapiUrl(`/api/referals?${qs.toString()}`), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const referalsData = await referalsRes.json();
    const referals = Array.isArray(referalsData.data) ? referalsData.data : [];
    // console.log("data:", userData, "comision:", commissionPercent, "referidos:", referals)
    return { commissionPercent, referals };
  } catch (error) {
    console.error("Error fetching affiliate data:", error);
    return { commissionPercent: 0, referals: [] };
  }
}

export default async function AffiliateDashboardPage({ params }) {
  const session = await auth();
  const userId = session?.user?.strapiUserId || "";
  const token = session?.strapiToken;

  const { commissionPercent, referals } = userId && token 
    ? await getAffiliateData(token, userId)
    : { commissionPercent: 0, referals: [] };

  const affiliatePath = userId
    ? `?ref=${encodeURIComponent(userId)}`
    : "/dashboard";

  return (
    // <MarketingLayout>
      <AffiliatesDashboard 
        affiliatePath={affiliatePath} 
        userId={userId} 
        commissionPercent={commissionPercent}
        referrals={referals}
      />

  );
}
