import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils";
import { buildStrapiUrl } from "@/lib/strapi";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Zap } from "lucide-react";
import ConfirmRechargeBattery from "@/components/confirm-recharge-battery";
import Image from "next/image";

export default async function BatteryPage({ params }) {
  const session = await auth();
  const p = await params;
  const chatbotSlug = String(p?.chatbot || "");

  if (!session) {
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(
        `/dashboard/${chatbotSlug}/battery`
      )}`
    );
  }

  const chatbot = await getChatbotBySlug(
    chatbotSlug,
    session.strapiToken,
    session.user.strapiUserId
  );
  if (!chatbot) redirect("/select");

  const documentId = chatbot.documentId;

  let plans = [];
  let error = null;

  try {
    const qs = new URLSearchParams();
    qs.set("fields[0]", "name");
    qs.set("fields[1]", "tokens_amount");
    qs.set("fields[2]", "tokens_bonus");
    qs.set("fields[3]", "sale_price");
    qs.set("fields[4]", "regular_price");
    qs.set("fields[5]", "features");
    qs.set("populate[image][fields][0]", "url");
    qs.set("populate[image][fields][1]", "name");

    const url = buildStrapiUrl(`/api/plan-tokens?${qs.toString()}`);
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
        `No se pudieron cargar los planes (status ${res.status})`;
    } else {
      const payload = await res.json();
      const items = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];
      plans = items.map((item) => {
        const a = item?.attributes || item || {};
        const img = a?.image?.data || a?.image;
        const imgAttrs = img?.attributes || img || {};
        return {
          id: item?.documentId || a?.documentId,
          name: a?.name || "",
          tokens_amount: a?.tokens_amount,
          tokens_bonus: a?.tokens_bonus,
          sale_price: a?.sale_price,
          regular_price: a?.regular_price,
          features: Array.isArray(a?.features) ? a.features : [],
          imageUrl: imgAttrs?.url || null,
          imageName: imgAttrs?.name || "",
        };
      });
    }
  } catch (e) {
    error = "Error al conectar con Strapi. Verifica tu conexión.";
  }
  
  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="py-4 md:py-6">
          <h1 className="text-2xl font-semibold">Batería</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Gestiona y monitorea el estado de tu batería de mensajes.
          </p>
        </div>

        <div className="w-full w-max-7xl mx-auto pb-8">
          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          ) : !plans || plans.length === 0 ? (
            <div className="rounded-lg border bg-muted/10 p-4 text-sm text-muted-foreground">
              No hay planes disponibles.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan, idx) => {
                const totalTokens =
                  (plan.tokens_amount || 0) + (plan.tokens_bonus || 0);
                const hasDiscount =
                  plan.regular_price && plan.regular_price !== plan.sale_price;

                return (
                  <Card
                    key={plan.id || plan.name}
                    style={{
                      animationDelay: `${idx * 100}ms`,
                      animationFillMode: "both",
                    }}
                    className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 ease-out hover:shadow-lg transition-all flex flex-col overflow-hidden rounded-2xl bg-card"
                  >
                    {/* Imagen cuadrada 1024x1024 */}
                    <div className="relative aspect-square w-48 overflow-hidden bg-muted/30 mx-auto">
                      {plan.imageUrl ? (
                        <Image
                          src={plan.imageUrl}
                          alt={plan.imageName || plan.name}
                          fill
                          className="object-cover mx-auto"
                          priority={idx < 3}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Zap className="h-24 w-24 text-muted-foreground/20" />
                        </div>
                      )}

                      {/* Badge de oferta */}
                      {hasDiscount && (
                        <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded-md shadow-lg">
                          OFERTA
                        </div>
                      )}
                    </div>

                    {/* Contenido */}
                    <CardContent className="p-6 flex flex-col flex-1">
                      {/* Nombre */}
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {plan.name}
                      </h3>
                      {hasDiscount && (
                        <span className="text-md text-red-400/80 dark:text-red-300/80 line-through">
                          ${plan.regular_price}
                        </span>
                      )}

                      {/* Precio */}
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-3xl font-bold text-foreground">
                          ${plan.sale_price}
                        </span>
                        {hasDiscount &&
                          plan.sale_price &&
                          plan.regular_price && (
                            <span className="text-sm font-semibold bg-green-300/80 dark:bg-green-400/80 px-2 py-1 rounded-md">
                              {(((plan.regular_price - plan.sale_price) /
                                plan.regular_price) *
                                100).toFixed(0)}%{" "}
                              OFF
                            </span>
                          )}
                      </div>

                      {/* Tokens info */}
                      <p className="text-xs text-muted-foreground mb-4">
                        {totalTokens.toLocaleString()} tokens
                        {plan.tokens_bonus > 0 && (
                          <span className="text-primary font-semibold ml-1">
                            (+{plan.tokens_bonus.toLocaleString()} bonus)
                          </span>
                        )}
                      </p>

                      {/* Features */}
                      {plan.features.length > 0 && (
                        <ul className="space-y-2 mb-6 flex-1">
                          {plan.features.map((feature, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                              <Check className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{String(feature)}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Botón */}
                      <div className="mt-auto">
                        <ConfirmRechargeBattery
                          planId={plan.id}
                          userId={session.user.strapiUserId}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
