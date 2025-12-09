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

  let structuredData = {
    hot: { id: null, items: [] },
    normal: { id: null, items: [] },
    cold: { id: null, items: [] },
  };
  let reminderError = null;

  try {
    const qs = new URLSearchParams();
    qs.set("filters[chatbot][documentId][$eq]", chatbot.documentId);
    qs.set("populate[remarketing_contents][populate]", "media");
    qs.set("populate[remarketing_contents][sort]", "order:asc");
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
          structuredData[type].id = item.documentId || item.id;

          const contents =
            attrs.remarketing_contents?.data ||
            attrs.remarketing_contents ||
            [];
          structuredData[type].items = contents.map((contentItem) => {
            const cAttrs = contentItem.attributes || contentItem;
            const mediaData = cAttrs.media?.data || cAttrs.media;

            return {
              id: contentItem.documentId || contentItem.id,
              content: cAttrs.content || "",
              type: mediaData ? "media" : "text",
              mediaUrl: mediaData
                ? mediaData.attributes?.url || mediaData.url
                : null,
              mediaMime: mediaData
                ? mediaData.attributes?.mime || mediaData.mime
                : null,
              mediaId: mediaData ? mediaData.documentId || mediaData.id : null,
              time_to_send: cAttrs.time_to_send || "",
            };
          });
        }
      });
    }
  } catch (e) {
    console.error(e);
    reminderError = "Error al cargar configuracion.";
  }

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="py-4 md:pt-6 flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Recordatorios</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Configura mensajes y multimedia por temperatura de lead. Cada
              mensaje tiene su propio tiempo de envio.
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
