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
    const settingsRes = await fetch(
      buildStrapiUrl(`/api/chatbots/${encodeURIComponent(chatbot.slug)}`),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.strapiToken}`,
        },
        cache: "no-store",
      }
    );

    if (!settingsRes.ok) {
      const details = await settingsRes.json().catch(() => ({}));
      reminderError =
        details?.error?.message ||
        `No se pudieron cargar los mensajes (status ${settingsRes.status})`;
    } else {
      const payload = await settingsRes.json();
      const attrs =
        payload?.data?.attributes || payload?.attributes || payload || {};
      reminderSettings = {
        hot: Array.isArray(attrs.reminder_hot_messages)
          ? attrs.reminder_hot_messages
          : attrs.reminder_hot_message
          ? [attrs.reminder_hot_message]
          : [],
        normal: Array.isArray(attrs.reminder_normal_messages)
          ? attrs.reminder_normal_messages
          : attrs.reminder_normal_message
          ? [attrs.reminder_normal_message]
          : [],
        cold: Array.isArray(attrs.reminder_cold_messages)
          ? attrs.reminder_cold_messages
          : attrs.reminder_cold_message
          ? [attrs.reminder_cold_message]
          : [],
        interval:
          attrs.reminder_interval_minutes ?? attrs.reminder_interval ?? "",
      };
    }
  } catch (e) {
    reminderError = "Error al cargar los mensajes de recordatorio.";
  }

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="py-4 md:py-6">
          <h1 className="text-2xl font-semibold">Recordatorio</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Configura los mensajes por temperatura y el intervalo de envio.
          </p>
        </div>

        <div className="pb-6">
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
