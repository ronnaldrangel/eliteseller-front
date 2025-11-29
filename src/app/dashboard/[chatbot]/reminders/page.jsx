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

  let reminderSettings = { hot: [], normal: [], cold: [], interval: "" };
  let reminderError = null;

  try {
    const qs = new URLSearchParams();
    qs.set("filters[chatbot][documentId][$eq]", chatbot.documentId);
    qs.set("fields[0]", "content");
    qs.set("fields[1]", "hotness_message");
    qs.set("pagination[pageSize]", "100");

    const remarkRes = await fetch(buildStrapiUrl(`/api/remarketings?${qs.toString()}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.strapiToken}`,
      },
      cache: "no-store",
    });

    if (!remarkRes.ok) {
      const details = await remarkRes.json().catch(() => ({}));
      reminderError = details?.error?.message || `No se pudieron cargar los mensajes (${remarkRes.status}).`;
    } else {
      const payload = await remarkRes.json();
      const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      const hot = [];
      const normal = [];
      const cold = [];
      items.forEach((item) => {
        const a = item?.attributes || item || {};
        const msg = a.content || item.content || "";
        const type = a.hotness_message || item.hotness_message || "";
        if (!msg || !type) return;
        if (type === "hot") hot.push(msg);
        else if (type === "normal") normal.push(msg);
        else if (type === "cold") cold.push(msg);
      });
      reminderSettings.hot = hot;
      reminderSettings.normal = normal;
      reminderSettings.cold = cold;

      const botRes = await fetch(buildStrapiUrl(`/api/chatbots/${encodeURIComponent(chatbot.slug)}`), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.strapiToken}`,
        },
        cache: "no-store",
      });
      if (botRes.ok) {
        const botPayload = await botRes.json();
        // console.log('botPayload',botPayload);
        const attrs = botPayload?.data?.attributes || botPayload?.attributes || botPayload || {};
        reminderSettings.interval = botPayload?.data?.cooldown_minutes ?? "";
      }
    }
  } catch (e) {
    reminderError = "Error al cargar los mensajes de recordatorio.";
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6 w-full max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold">Recordatorios</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Configura los mensajes por temperatura y el intervalo de envío.
            </p>
          </div>
        </div>

        <div className="px-4 lg:px-6 w-full max-w-7xl mx-auto">
          {reminderError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
              {reminderError}
            </div>
          ) : (
            <ReminderMessages
              token={session.strapiToken}
              chatbotSlug={chatbot.slug}
              chatbotId={chatbot.documentId}
              initialHot={reminderSettings.hot}
              initialNormal={reminderSettings.normal}
              initialCold={reminderSettings.cold}
              initialInterval={reminderSettings.interval}
            />
          )}
        </div>
      </div>
    </div>
  );
}
