import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Marquee } from "@/components/ui/marquee";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MarketingLayout from "@/components/marketing-layout";
import { Check, Star, ShieldCheck, Zap, Headset, Smile, Rocket } from "lucide-react";
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
    const authHeaders = session?.strapiToken
      ? { Authorization: `Bearer ${session.strapiToken}` }
      : {};

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
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

  const sortedPlans = [...dynamicPlans].sort(
    (a, b) => Number(a?.price ?? 0) - Number(b?.price ?? 0)
  );

  const plans = [
    ...sortedPlans.map((plan, index) => {
      let price = plan.price;
      let billingPeriod = plan.billing_period;
      let regularPrice = plan.regular_price;
      let annualPriceDisplay = null;

      const isAnnual = ['year', 'annual', 'anual'].includes((billingPeriod || '').toLowerCase());

      if (isAnnual && price) {
        annualPriceDisplay = `${price}$ facturado anualmente`;
        const monthly = parseFloat(price) / 12;
        price = monthly % 1 === 0 ? monthly.toFixed(0) : monthly.toFixed(2);
        billingPeriod = 'mensual';

        if (regularPrice) {
          const monthlyRegular = parseFloat(regularPrice) / 12;
          regularPrice = monthlyRegular % 1 === 0 ? monthlyRegular.toFixed(0) : monthlyRegular.toFixed(2);
        }
      }

      return {
        title: plan.name,
        price: `${price}$`,
        priceClass: "text-3xl font-bold",
        perText: `/ ${billingPeriod}`,
        beforePrice: regularPrice
          ? `${regularPrice}$/${billingPeriod}`
          : "",
        features: plan.features || [],
        planId: plan.plan_id,
        delay: `${index * 150}ms`,
        highlight: false,
        badgeText: undefined,
        featureIconColor: "text-green-600",
        annualPriceDisplay,
        billingPeriod,
        originalBillingPeriod: plan.billing_period,
      };
    })
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
    annualPriceDisplay,
    billingPeriod,
    originalBillingPeriod,
  }) => {
    const highlightClasses = highlight
      ? "relative ring-2 ring-primary ring-opacity-10 shadow-2xl bg-gradient-to-b from-primary/5 via-transparent to-transparent border-primary/20"
      : "hover:shadow-xl border-border/50";

    return (
      <Card
        style={{ animationDelay: delay, animationFillMode: "both" }}
        className={`animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 ease-out transition-all h-full flex flex-col group ${highlightClasses} rounded-2xl overflow-hidden`}
      >
        {highlight && (
          <div className="absolute top-0 right-0 overflow-hidden w-24 h-24">
            <div className="absolute top-4 -right-8 bg-primary text-primary-foreground text-[10px] font-bold py-1 px-10 rotate-45 shadow-sm">
              {badgeText || "POPULAR"}
            </div>
          </div>
        )}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-md font-medium tracking-tight uppercase">PLAN {originalBillingPeriod}</CardTitle>
          </div>
          <div className="text-xl font-semibold text-foreground mt-1 text-left">{title}</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`${priceClass} text-foreground tracking-tight`}>{price}</span>
            {perText && <span className="text-muted-foreground text-sm font-medium">{perText}</span>}
          </div>
          {beforePrice && (
            <div className="mt-1 text-sm flex items-center gap-2">
              <span className="text-muted-foreground line-through opacity-60">{beforePrice}</span>
            </div>
          )}
          {annualPriceDisplay && (
            <div className="mt-1 text-xs text-muted-foreground font-medium text-left">
              {annualPriceDisplay}
            </div>
          )}

        </CardHeader>
        <CardContent className="pt-0 flex flex-col flex-1">
          <div className="h-px w-full bg-border/50 mb-6" />
          <ul className="space-y-3.5 text-sm text-muted-foreground mb-8">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-3 leading-snug">
                <div className={`mt-0.5 rounded-full p-0.5 ${highlight ? "bg-primary/10" : "bg-muted"}`}>
                  <Check className={`h-3.5 w-3.5 ${featureIconColor}`} />
                </div>
                <span className="group-hover:text-foreground transition-colors">{f}</span>
              </li>
            ))}
          </ul>
          {planId ? (
            <div className="w-full mt-auto">
              <SubscribePlanButton planId={planId} userId={session?.user?.strapiUserId} highlight={highlight} />
            </div>
          ) : (
            <Button
              size="lg"
              className={`w-full mt-auto h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform group relative overflow-hidden flex items-center justify-center gap-2 ${highlight
                ? "bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 hover:shadow-primary/40 scale-100 hover:scale-[1.02] active:scale-[0.98]"
                : "hover:scale-[1.02] active:scale-[0.98]"
                }`}
              asChild
            >
              <a href={href} className="flex items-center gap-2">
                <span>Empieza ahora</span>
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                {/* Shine effect */}
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine" />
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const FAQS = [
    {
      q: "¿Puedo cancelar mi plan en cualquier momento?",
      a: "Sí, puedes cancelar tu suscripción cuando quieras desde el panel de facturación. No hay contratos forzosos."
    },
    {
      q: "¿Existen descuentos por pago anual?",
      a: "Actualmente ofrecemos estos precios promocionales. Mantente atento a nuestras comunicaciones para futuras ofertas anuales."
    },
    {
      q: "¿Qué métodos de pago aceptan?",
      a: "Aceptamos todas las tarjetas de crédito y débito principales a través de nuestra plataforma segura de pagos."
    }
  ];

  const brands = [
    "Amazon FBA", "Mercado Libre", "Shopify", "Walmart", "eBay", "WooCommerce"
  ];

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <div className="relative text-center overflow-hidden py-6">
        <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Antes de crea tu bot <br className="hidden md:block" />
            <span className="text-primary">elige tu plan</span>
          </h1>
          <p className="max-w-[600px] mx-auto text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
            Empieza sin riesgo, cancela cuando quieras.
          </p>
        </div>

        {error ? (
          <div className="mt-8 rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-destructive max-w-2xl mx-auto backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 mb-2 font-bold">
              <ShieldCheck className="h-5 w-5" />
              Error de conexión
            </div>
            {error}
          </div>
        ) : (
          <>
            <div className="mx-auto">

              <div className="max-w-4xl mx-auto ">
                <CountdownOffer days={7} color="#ef4444" />
              </div>

              <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
                {plans.map((p, idx) => (
                  <PlanCard key={`${p.planId || p.title || "plan"}-${idx}`} {...p} />
                ))}
              </div>

            </div>
          </>
        )}
      </div>

      {!error && (
        <div className="max-w-5xl py-20 mx-auto">
          <h2 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-12">
            TU NEGOCIO SEGURO CON NOSOTROS
          </h2>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4 px-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100/80 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                <Headset className="h-6 w-6" />
              </div>
              <span className="font-semibold text-lg">Soporte 24/7</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100/80 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                <Smile className="h-6 w-6" />
              </div>
              <span className="font-semibold text-lg">Cancela cuando quieras</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100/80 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                <Rocket className="h-6 w-6" />
              </div>
              <span className="font-semibold text-lg">7 Días de Garantía</span>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      {!error && (
        <div className="py-20 border-t">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Preguntas <span className="text-primary">Frecuentes</span></h2>
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-b/50">
                  <AccordionTrigger className="text-left font-semibold text-lg py-6 hover:text-primary transition-colors">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      )}
    </MarketingLayout>
  );
}
