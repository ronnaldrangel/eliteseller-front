import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import { redirect } from "next/navigation";
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils";
import NewTriggerForm from "../../new/new-trigger-form";

export default async function EditTriggerPage({ params }) {
  const session = await auth();
  const { chatbot: chatbotParam, triggerId } = await params;
  const chatbotSlug = String(chatbotParam || "");
  const triggerDocId = String(triggerId || "");

  if (!session) {
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(
        `/dashboard/${chatbotSlug}/triggers/${triggerDocId}/edit`
      )}`
    );
  }

  const chatbot = await getChatbotBySlug(
    chatbotSlug,
    session.strapiToken,
    session.user.strapiUserId
  );
  if (!chatbot) redirect("/select");

  // === POPULATE CORRECTO (trigger + contenidos + media) ===
  const qs = new URLSearchParams();

  // Campos del trigger
  qs.set("fields[0]", "name");
  qs.set("fields[1]", "keywords");
  qs.set("fields[2]", "keywords_ai");
  qs.set("fields[3]", "available");
  qs.set("fields[4]", "id_ads");

  // Contenidos (mensaje + documentId/id)
  qs.set("populate[trigger_contents][fields][0]", "message");
  qs.set("populate[trigger_contents][fields][1]", "documentId");
  qs.set("populate[trigger_contents][fields][2]", "type");

  // Media dentro de cada contenido
  qs.set(
    "populate[trigger_contents][populate][messageMedia][fields][0]",
    "name"
  );
  qs.set(
    "populate[trigger_contents][populate][messageMedia][fields][1]",
    "url"
  );
  qs.set(
    "populate[trigger_contents][populate][messageMedia][fields][2]",
    "size"
  );
  qs.set(
    "populate[trigger_contents][populate][messageMedia][fields][3]",
    "ext"
  );
  qs.set(
    "populate[trigger_contents][populate][messageMedia][fields][4]",
    "width"
  );
  qs.set(
    "populate[trigger_contents][populate][messageMedia][fields][5]",
    "height"
  );

  const url = buildStrapiUrl(`/api/triggers/${triggerDocId}?${qs.toString()}`);

  let trigger = null;
  let loadError = null;

  try {
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
      loadError =
        details?.error?.message ||
        `No se pudo cargar el disparador (status ${res.status}).`;
    } else {
      const data = await res.json();
      // console.log("Trigger raw data from Strapi:", data, "From URL:", url);
      const raw = data?.data;

      // helper: convertir media (objeto o array) a data[]
      const toMediaDataArray = (mm) => {
        if (!mm) return [];
        const arr = Array.isArray(mm) ? mm : [mm]; // acepta simple o múltiple
        return arr.map((m) => ({
          id: m.id,
          attributes: {
            name: m.name,
            url: m.url,
            size: m.size,
            ext: m.ext,
            width: m.width,
            height: m.height,
            documentId: m.documentId,
          },
        }));
      };

      const contents = Array.isArray(raw?.trigger_contents)
        ? raw.trigger_contents
        : [];

      trigger = {
        id: raw?.id,
        documentId: raw?.documentId,
        name: raw?.name ?? "",
        keywords: raw?.keywords ?? "",
        keywords_ai: raw?.keywords_ai ?? "",
        available: raw?.available ?? true,
        id_ads: raw?.id_ads ?? "",
        trigger_contents: contents.map((c) => ({
          id: c.id,
          documentId: c.documentId,
          message: c?.message ?? "",
          type: c?.type ?? (c?.message ? "message" : "media"),
          // normalizado al formato que usa el form (messageMedia.data = [])
          messageMedia: {
            data: toMediaDataArray(c?.messageMedia),
          },
        })),
      };
    }
  } catch (error) {
    console.error("Error fetching trigger:", error);
    loadError = "Error al conectar con Strapi. Verifica tu conexion.";
  }

  if (loadError || !trigger) {
    return (
      <div className="flex flex-1 flex-col px-4 lg:px-6">
        <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Editar disparador</h1>
            <p className="text-sm text-muted-foreground">
              Modifica la configuracion de tu disparador automatico.
            </p>
          </div>
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {loadError || "No se encontro el disparador."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <NewTriggerForm
          token={session.strapiToken}
          chatbotId={chatbot.documentId}
          chatbotSlug={chatbot.slug}
          initialTrigger={trigger}
          mode="edit"
        />
      </div>
    </div>
  );
}
