import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewTriggerForm from "./new-trigger-form";
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils";

export default async function NewTriggerPage({ params }) {
  const session = await auth();
  const { chatbot: chatbotParam } = await params;
  const chatbotSlug = String(chatbotParam || "");

  if (!session) {
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(
        `/dashboard/${chatbotSlug}/triggers/new`
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

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main mx-auto w-full max-w-7xl flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between py-4 md:py-6">
          <div>
            <h1 className="text-2xl font-semibold">Crear disparador</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Rellena los campos para registrar un nuevo disparador.
            </p>
          </div>
        </div>

        <NewTriggerForm
          token={session.strapiToken}
          chatbotId={chatbot.documentId}
          chatbotSlug={chatbotSlug}
        />
      </div>
    </div>
  );
}