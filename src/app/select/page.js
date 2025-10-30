import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SelectUserAvatarMenu from "@/components/select-user-avatar-menu";
import { PlusIcon } from "lucide-react";

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
      )}`
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
      console.log("Fetched chatbots data:", data);
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

  const cards = Array.isArray(chatbots)
    ? chatbots.map((item) => {
        const attrs = item?.attributes || {};
        const routeId = String(item?.documentId ?? item?.id ?? "");
        const displayId =
          typeof item?.id !== "undefined" && item?.id !== null
            ? String(item.id)
            : "";
        const name =
          attrs.chatbot_name ||
          item?.chatbot_name ||
          attrs.name ||
          attrs.title ||
          // attrs.slug ||
          `Chatbot #${displayId || routeId}`;
        const slug = item.slug || "";
        const description = attrs.description || "";
        const custom = !!(attrs.custom ?? item?.custom ?? false);
        return { routeId, displayId, name, slug, description, custom };
      })
    : [];

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto max-w-6xl px-4 lg:px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/select" className="block" aria-label="Inicio">
              <span className="inline-flex items-center">
                <Image
                  src="/images/logo-black.png"
                  alt="Logo"
                  width={140}
                  height={24}
                  priority
                  className="h-8 w-auto dark:hidden"
                />
                <Image
                  src="/images/logo-white.png"
                  alt="Logo"
                  width={140}
                  height={24}
                  priority
                  className="hidden h-8 w-auto dark:block"
                />
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <SelectUserAvatarMenu />
          </div>
        </div>

        <div className="mt-10">
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
              {/* Crear chatbot como opción adicional (debajo del título) */}
              <Link
                href="/plans"
                className="group rounded-lg border bg-card p-6 aspect-square flex flex-col items-center justify-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-accent/30"
                aria-label="Crear bot"
                title="Crear bot"
              >
                <PlusIcon className="size-16 text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="mt-3 font-semibold">Crear bot</div>
              </Link>

              {cards.length > 0 ? (
                <>
                  {cards.map((c) => (
                    <Link
                      key={c.routeId}
                      href={`/dashboard/${encodeURIComponent(c.slug)}/home`}
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
                      <div className="mt-3 font-medium line-clamp-1 text-lg">
                        {c.name}
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
      </div>
    </div>
  );
}
