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

  if (!chatbot) {
    redirect("/select");
  }

  // Cargar el trigger con sus mensajes relacionados
  const qs = new URLSearchParams();
  qs.set("populate[trigger_contents][fields][0]", "message");
  qs.set("populate[trigger_contents][fields][1]", "documentId");

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
      trigger = data?.data || data;
    }
  } catch (error) {
    loadError = "Error al conectar con Strapi. Verifica tu conexion.";
  }

  if (loadError || !trigger) {
    return (
      <div className="flex flex-1 flex-col px-4 lg:px-6">
        <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold">Editar disparador</h1>
              <p className="text-sm text-muted-foreground">
                Modifica la configuracion de tu disparador automatico.
              </p>
            </div>
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Editar disparador</h1>
            <p className="text-sm text-muted-foreground">
              Modifica la configuracion de tu disparador automatico.
            </p>
          </div>
        </div>

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
