import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MarketingLayout from "@/components/marketing-layout";
import { Check } from "lucide-react";
import CountdownOffer from "@/components/countdown-offer";
import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import SubscribePlanButton from "@/components/subscribe-plan-button";

export const metadata = {
  title: "Planes",
  description: "Elige el plan que mejor se adapte a tu negocio.",
};

export default async function PlansPage() {
  const session = await auth();

  let dynamicPlans = [];
  let error = null;

  const qs = new URLSearchParams();
  qs.set("filters[has_trial][$eq]", "false")

  try {
    const url = buildStrapiUrl(`/api/plans?${qs.toString()}`);
    const apiToken = process.env.STRAPI_API_TOKEN;
    const authHeader =
      apiToken?.trim().length > 0
        ? { Authorization: `Bearer ${apiToken}` }
        : session?.strapiToken
          ? { Authorization: `Bearer ${session.strapiToken}` }
          : {};
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const details = await res.json().catch(() => ({}));
      error =
        details?.error?.message ||
        `No se pudo cargar los planes (status ${res.status})`;
    } else {
      const data = await res.json();
      const items = Array.isArray(data) ? data : data?.data || [];
      const normalize = (item) => {
        const attrs = item?.attributes || item || {};
        return {
          ...attrs,
          plan_id: attrs.plan_id || attrs.planId || item?.plan_id || item?.planId,
        };
      };
      dynamicPlans = items.map(normalize).filter(Boolean);
    }
  } catch (e) {
    console.error("Error fetching plans:", e);
    error = "Error al conectar con Strapi. Verifica tu conexión.";
  }

  // Este plan rompe el patrón de los demás por el precio y personalización
  const empresarialPlan = {
    title: "Empresarial",
    price: "Precio a medida",
    priceClass: "text-3xl font-bold",
    perText: "",
    beforePrice: "",
    features: [
      "Todas las funciones incluidas",
      "Multiples número de WhatsApp",
      "Ilimitados miembros del equipo",
      "Flujos automatizados ilimitados",
      "Reportes avanzados y analytics",
      "Soporte 24/7 dedicado",
      "Integraciones personalizadas",
    ],
    href: "https://www.instagram.com/elitecode.es/",
    delay: "300ms",
    highlight: false,
    featureIconColor: "text-green-600",
  };

  const sortedPlans = [...dynamicPlans].sort(
    (a, b) => Number(a?.price ?? 0) - Number(b?.price ?? 0)
  );

  const plans = [
    ...sortedPlans.map((plan, index) => {
      const isPremium = plan.plan_id === "PREMIUM";
      return {
        title: plan.name,
        price: `${plan.price}$`,
        priceClass: isPremium
          ? "text-4xl font-extrabold"
          : "text-3xl font-bold",
        perText: `al ${plan.billing_period}`,
        beforePrice: plan.regular_price
          ? `${plan.regular_price}$/${plan.billing_period}`
          : "",
        features: plan.features || [],
        planId: plan.plan_id,
        delay: `${index * 150}ms`,
        highlight: isPremium,
        badgeText: isPremium ? "Mejor opción" : undefined,
        featureIconColor: isPremium ? "text-cyan-600" : "text-green-600",
      };
    }),
    empresarialPlan,
  ];

  const PlanCard = ({
    title,
    price,
    priceClass,
    perText,
    beforePrice,
    features,
    href,
    planId,
    delay,
    highlight,
    badgeText,
    featureIconColor,
  }) => {
    const highlightClasses = highlight
      ? "relative ring-opacity-70 shadow-xl bg-gradient-to-b from-[rgba(84,162,177,0.12)] dark:from-[rgba(84,162,177,0.12)] hover:shadow-2xl"
      : "hover:shadow-lg";

    return (
      <Card
        style={{ animationDelay: delay, animationFillMode: "both" }}
        className={`animate-in fade-in-0 slide-in-from-bottom-2 duration-1000 ease-out transition-shadow h-full flex flex-col ${highlightClasses}`}
      >
        {highlight && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 shadow">
            {badgeText || "Mejor opción"}
          </div>
        )}
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            <span className={`${priceClass} text-foreground`}>{price}</span>
            {perText && <span className="ml-1">{perText}</span>}
          </CardDescription>
          {beforePrice && (
            <div className="mt-1 text-xs">
              <span className="text-muted-foreground">Antes: </span>
              <span className="line-through opacity-70">{beforePrice}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-2 flex flex-col flex-1">
          <ul className="space-y-2 text-sm text-muted-foreground mb-6">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className={`h-4 w-4 ${featureIconColor}`} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {planId ? (
            <div className="w-full mt-auto">
              <SubscribePlanButton planId={planId} userId={session?.user?.strapiUserId} />
            </div>
          ) : (
            <Button size="lg" className="w-full mt-auto h-12 text-base cursor-pointer" asChild>
              <a href={href}>Empieza ahora</a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <MarketingLayout>
      <div className="mt-2">
        <h1 className="text-2xl font-semibold">Empieza ahora</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Elige el plan que mejor se adapte a tu negocio.
        </p>
      </div>
      {error ? (
        <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      ) : (
        <>
          <CountdownOffer days={7} color="#ef4444" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p, idx) => (
              <PlanCard key={`${p.planId || p.title || "plan"}-${idx}`} {...p} />
            ))}
          </div>
        </>
      )}
    </MarketingLayout>
  );
}
