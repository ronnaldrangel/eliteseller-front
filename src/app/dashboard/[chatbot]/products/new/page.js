import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewProductForm from "./new-product-form";
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils";

export default async function NewProductPage({ params }) {
  const session = await auth();
  const { chatbot: chatbotParam } = await params;
  const chatbotSlug = String(chatbotParam || "");

  if (!session) {
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(
        `/dashboard/${chatbotSlug}/products/new`
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
        <div className="@container/main mx-auto w-full flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">

        <NewProductForm
          token={session.strapiToken}
          chatbotId={chatbot.documentId}
          chatbotSlug={chatbotSlug}
        />
      </div>
    </div>
  );
}
