import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MarketingLayout from "@/components/marketing-layout";
import { PlusIcon } from "lucide-react";
import { buildChatbotIdentifiers } from "@/lib/utils/chatbot-route";

export default async function SelectPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login?callbackUrl=/select");
  }

  let chatbots = [];
  let error = null;

  try {
    const userId = session?.user?.strapiUserId;
    const url = buildStrapiUrl(
      `/api/chatbots?filters[users_permissions_user][id][$eq]=${encodeURIComponent(
        userId
      )}&populate[subscription][populate]=plan`
    );

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
        `No se pudo cargar tus chatbots (status ${res.status})`;
    } else {
      const data = await res.json();
      chatbots = Array.isArray(data) ? data : data?.data || [];
    }
  } catch (e) {
    console.error("Error fetching chatbots:", e);
    error = "Error al conectar con Strapi. Verifica tu conexión.";
  }

  // Si el usuario tiene al menos un chatbot, redirige automáticamente al primero usando documentId
  // if (!error && Array.isArray(chatbots) && chatbots.length > 0) {
  //   const first = chatbots[0]
  //   const firstRouteId = String(first?.documentId ?? first?.id ?? '')
  //   if (firstRouteId) {
  //     redirect(`/dashboard/${encodeURIComponent(firstRouteId)}/home`)
  //   }
  // }

  const getPlanColor = (planId) => {
    if (!planId) return "bg-muted";

    if (planId === "BASICO" || planId === "TRIAL_BASICO") {
      return "bg-sky-600";
    } else if (planId === "GALACTICO" || planId === "TRIAL_GALACTICO") {
      return "bg-gradient-to-r from-purple-600 to-pink-600";
    }
    return "bg-muted";
  };

  const cards = Array.isArray(chatbots)
    ? chatbots.map((item) => {
        const attrs = item?.attributes || {};
        const meta = buildChatbotIdentifiers(
          item,
          session?.user?.strapiUserId || ""
        );
        const planId = item.subscription?.plan?.plan_id || null;
        const plan = item.subscription?.plan?.name || null;
        const description = attrs.description || "";
        const custom = !!(attrs.custom ?? item?.custom ?? false);
        return {
          documentId: meta.documentId,
          displayId: meta.id,
          name: meta.name,
          routeSegment: meta.routeSegment,
          description,
          custom,
          planId,
          plan,
        };
      })
    : [];

  return (
    <MarketingLayout>
      <div className="mt-2">
        <h1 className="text-2xl font-semibold">Elige tu chatbot</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Dale click a tu chatbot para gestionarlo.
        </p>
      </div>

      <div className="mt-8 grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        ) : (
          <>
            <Link
              href="/plans"
              className="group rounded-lg border bg-card p-6 aspect-square flex flex-col items-center justify-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-accent/30"
              aria-label="Crear bot"
              title="Crear bot"
            >
              <PlusIcon className="size-16 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="mt-3 text-sm md:text-base font-semibold">Crear bot</div>
            </Link>

            {cards.length > 0 ? (
              <>
                {cards.map((c) => (
                  <Link
                    key={c.routeSegment}
                    href={`/dashboard/${encodeURIComponent(
                      c.routeSegment
                    )}/home`}
                    className="group relative rounded-lg border bg-card p-6 aspect-square flex flex-col items-center justify-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-accent/30"
                    aria-label={`Entrar a ${c.name}`}
                  >
                    <Image
                      src="/images/bot.webp"
                      alt={c.name}
                      width={120}
                      height={120}
                      className="h-20 w-20 rounded-md object-cover grayscale group-hover:grayscale-0 group-focus-visible:grayscale-0 transition-all duration-200"
                    />
                    <div className="mt-3 font-medium md:line-clamp-2 text-sm md:text-lg space-y-2">
                      <span className="block">{c.name}</span>
                      {c.plan && (
                        <span
                          className={`inline py-2 px-2.5 rounded-md text-white text-xs font-medium capitalize ${getPlanColor(
                            c.planId
                          )}`}
                        >{`plan ${c.plan}`}</span>
                      )}
                    </div>
                    {c.custom && (
                      <span className="mt-2 rounded px-2 py-0.5 text-xs font-medium bg-purple-600 text-white shadow-sm">
                        Personalizado
                      </span>
                    )}
                  </Link>
                ))}
              </>
            ) : (
              <div></div>
            )}
          </>
        )}
      </div>
    </MarketingLayout>
  );
}
