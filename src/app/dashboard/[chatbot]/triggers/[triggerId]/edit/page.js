import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import { redirect } from "next/navigation";
import NewTriggerForm from "../../new/new-trigger-form.jsx";
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils";
import { normalizeTriggerEntry } from "../../trigger-normalizer";

export default async function EditTriggerPage({ params }) {
  const session = await auth();
  const { chatbot: chatbotParam, triggerId } = await params;
  const chatbotSlug = String(chatbotParam || "");
  const triggerParam = String(triggerId || "");

  if (!session) {
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(
        `/dashboard/${chatbotSlug}/triggers/${triggerParam}/edit`
      )}`
    );
  }

  const chatbot = await getChatbotBySlug(
    chatbotSlug,
    session.strapiToken,
    session.user.strapiUserId
  );

  if (!chatbot) {
    redirect("/select");
  }

  // Buscar el disparador por id o documentId y vinculado al chatbot actual
  const qs = new URLSearchParams();
  qs.set("populate", "*");
  qs.set("filters[$and][0][$or][0][documentId][$eq]", triggerParam);
  qs.set("filters[$and][0][$or][1][id][$eq]", triggerParam);
  qs.set("filters[$and][1][chatbot][documentId][$eq]", chatbot.documentId);

  const url = buildStrapiUrl(`/api/triggers?${qs.toString()}`);

  let entry = null;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.strapiToken}`,
      },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.data || [];
      entry = list?.[0] || null;
    }
  } catch (error) {
    // Ignorar y redirigir si falla.
  }

  const trigger = normalizeTriggerEntry(entry);

  if (!trigger) {
    redirect(`/dashboard/${encodeURIComponent(chatbotSlug)}/triggers`);
  }

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between py-4 md:py-6">
          <div>
            <h1 className="text-2xl font-semibold">Editar disparador</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Actualiza los campos del disparador seleccionado.
            </p>
          </div>
        </div>

        <NewTriggerForm
          token={session.strapiToken}
          chatbotId={chatbot.documentId}
          chatbotSlug={chatbotSlug}
          initialTrigger={trigger}
          mode="edit"
        />
      </div>
    </div>
  );
}
