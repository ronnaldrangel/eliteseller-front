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
import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import SubscribePlanButton from "@/components/subscribe-plan-button";

export const metadata = {
  title: "Planes de Prueba",
  description: "Prueba nuestros planes con período de prueba gratuito.",
};

export default async function TrialPlansPage() {
  const session = await auth();

  let dynamicPlans = [];
  let error = null;

  // Obtener los planes con flag "has_trial" en true
  const qs = new URLSearchParams();
  qs.set("filters[has_trial][$eq]", "true");

  try {
    const url = buildStrapiUrl(`/api/plans?${qs.toString()}`);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.strapiToken}`,
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
      dynamicPlans = Array.isArray(data) ? data : data?.data || [];
      console.log("Fetched trial plans:", dynamicPlans);
    }
  } catch (e) {
    console.error("Error fetching trial plans:", e);
    error = "Error al conectar con Strapi. Verifica tu conexión.";
  }

  const sortedPlans = [...dynamicPlans].sort(
    (a, b) => Number(a?.price ?? 0) - Number(b?.price ?? 0)
  );

  const plans = sortedPlans.map((plan, index) => {
    const isPremium = plan.plan_id === "PREMIUM";
    return {
      title: plan.name,
      price: `${plan.price}$`,
      trial_price: `${plan.trial_price}$`,
      priceClass: isPremium ? "text-4xl font-extrabold" : "text-3xl font-bold",
      perText: `al ${plan.billing_period}`,
      beforePrice: `${plan.price}$/${plan.billing_period}`,
      features: plan.features || [],
      planId: plan.plan_id,
      delay: `${index * 150}ms`,
      highlight: isPremium,
      badgeText: isPremium ? "Mejor opción" : undefined,
      featureIconColor: isPremium ? "text-cyan-600" : "text-green-600",
    };
  });

  const PlanCard = ({
    title,
    price,
    trial_price,
    priceClass,
    perText,
    beforePrice,
    features,
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
            <span className={`${priceClass} text-foreground`}>{trial_price}</span>
            <span className="ml-1">por 7 dias</span>
          </CardDescription>
          {beforePrice && (
            <div className="mt-1 text-xs">
              <span className="text-muted-foreground">Despues </span>
              <span className="opacity-70">{beforePrice}</span>
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
          <div className="w-full mt-auto">
            <SubscribePlanButton
              planId={planId}
              userId={session?.user?.strapiUserId}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MarketingLayout>
      <div className="mt-2">
        <h1 className="text-2xl font-semibold">🎉 Empieza tus 7 días gratis</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Elige el plan que mejor se adapte a tu negocio y comienza tu prueba
          gratuita.
        </p>
      </div>
      {error ? (
        <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      ) : dynamicPlans.length === 0 ? (
        <div className="mt-8 text-center text-muted-foreground">
          No hay planes de prueba disponibles en este momento.
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {plans.map((p) => (
            <PlanCard key={p.title} {...p} />
          ))}
        </div>
      )}
    </MarketingLayout>
  );
}
