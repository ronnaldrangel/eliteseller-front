import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import { redirect } from "next/navigation";
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils";
import ReminderMessages from "@/components/reminder-messages";

export default async function RemindersPage({ params }) {
  const session = await auth();
  const p = await params;
  const chatbotSlug = String(p?.chatbot || "");

  if (!session) {
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(
        `/dashboard/${chatbotSlug}/reminders`
      )}`
    );
  }

  const chatbot = await getChatbotBySlug(
    chatbotSlug,
    session.strapiToken,
    session.user.strapiUserId
  );
  if (!chatbot) redirect("/select");

  // Estructura para almacenar datos padres (Remarketing) e hijos (Contents)
  let structuredData = {
    hot: { id: null, remarketing_groups: [] },
    normal: { id: null, remarketing_groups: [] },
    cold: { id: null, remarketing_groups: [] },
  };
  let reminderError = null;

  try {
    const qs = new URLSearchParams();
    qs.set("filters[chatbot][documentId][$eq]", chatbot.documentId);

    // Solicitamos la relación anidada y la media
    qs.set("populate[remarketing_groups][populate][remarketing_contents][populate]", "media");
    qs.set("populate[remarketing_groups][sort]", "order:asc");
    qs.set("populate[remarketing_groups][populate][remarketing_contents][sort]", "order:asc");

    qs.set("pagination[pageSize]", "100");

    const remarkRes = await fetch(
      buildStrapiUrl(`/api/remarketings?${qs.toString()}`),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.strapiToken}`,
        },
        cache: "no-store",
      }
    );

    if (!remarkRes.ok) {
      const details = await remarkRes.json().catch(() => ({}));
      reminderError = details?.error?.message || `Error (${remarkRes.status}).`;
    } else {
      const payload = await remarkRes.json();
      const remarketings = Array.isArray(payload?.data) ? payload.data : [];

      remarketings.forEach((item) => {
        const attrs = item.attributes || item;
        const type = attrs.hotness;

        if (type && structuredData[type]) {
          // Guardamos ambos identificadores del padre
          structuredData[type].id = item.id || item.documentId;
          structuredData[type].documentId = item.documentId || item.id;

          // Procesamos los grupos (Groups)
          const groups =
            attrs.remarketing_groups?.data ||
            attrs.remarketing_groups ||
            [];
          
          structuredData[type].remarketing_groups = groups.map((group) => {
            const gAttrs = group.attributes || group;
            const contents =
                gAttrs.remarketing_contents?.data ||
                gAttrs.remarketing_contents ||
                [];

            return {
                id: group.id || group.documentId,
                documentId: group.documentId || group.id,
                order: gAttrs.order,
                time_to_send: gAttrs.time_to_send,
                remarketing_contents: contents.map((contentItem) => {
                    const cAttrs = contentItem.attributes || contentItem;
                    const mediaData = cAttrs.media?.data || cAttrs.media;
                    const mediaAttrs = mediaData?.attributes || mediaData || {};
                    const ext = String(mediaAttrs.ext || mediaAttrs.extname || "").toLowerCase();
                    const mimeFromApi = mediaAttrs.mime || mediaAttrs.mimetype || "";
                    // Si el ext indica pdf (u otro no visual), forzamos mime para evitar mostrar thumbnails aleatorios
                    const normalizedMime =
                    ext === ".pdf" || mimeFromApi === "application/pdf"
                        ? "application/pdf"
                        : mimeFromApi;

                    return {
                    // Conservamos id numérico cuando exista
                    id: contentItem.id || contentItem.documentId,
                    documentId: contentItem.documentId || contentItem.id,
                    content: cAttrs.content || "",
                    type: mediaData ? "media" : "text",
                    mediaUrl: mediaData
                        ? mediaData.attributes?.url || mediaData.url
                        : null,
                    mediaMime: mediaData ? normalizedMime : null,
                    // preferimos el id numérico para que Strapi acepte la relación
                    mediaId: mediaData ? mediaData.id || mediaData.documentId : null,
                    mediaDocumentId: mediaData
                        ? mediaData.documentId || mediaData.id
                        : null,
                    order: cAttrs.order,
                    };
                })
            };
          });
        }
      });
    }
  } catch (e) {
    console.error(e);
    reminderError = "Error al cargar configuración.";
  }

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="py-4 md:pt-6 flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Recordatorios</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Configura mensajes y multimedia por temperatura de lead. Cada mensaje tiene su propio tiempo de envío.
            </p>
          </div>
        </div>

        <div>
          {reminderError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
              {reminderError}
            </div>
          ) : (
            <ReminderMessages
              token={session.strapiToken}
              chatbotSlug={chatbot.slug}
              chatbotId={chatbot.documentId}
              initialData={structuredData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
