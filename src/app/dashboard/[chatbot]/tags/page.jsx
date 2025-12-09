import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import { redirect } from "next/navigation";

import { getChatbotBySlug } from "@/lib/utils/chatbot-utils";
import TagsPageClient from "./page-client";

export default async function TagsPage({ params }) {
  const session = await auth();
  const { chatbot: chatbotParam } = await params;
  const chatbotSlug = String(chatbotParam || "");

  if (!session) {
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(
        `/dashboard/${chatbotSlug}/tags`
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

  const qs = new URLSearchParams();
  qs.set("filters[chatbot][documentId][$eq]", chatbot.documentId);

  const url = buildStrapiUrl(`/api/tags?${qs.toString()}`);

  let tags = [];
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
    console.log("Fetched Url:", url);
    if (!res.ok) {
      const details = await res.json().catch(() => ({}));
      loadError =
        details?.error?.message ||
        `No se pudieron cargar las etiquetas (status ${res.status}).`;
    } else {
      const data = await res.json();
      tags = Array.isArray(data) ? data : data?.data || [];
    }
  } catch (error) {
    loadError = "Error al conectar con Strapi. Verifica tu conexion.";
  }

  return (
    <TagsPageClient
      tags={tags}
      loadError={loadError}
      session={session}
      chatbot={chatbot}
    />
  );
}
