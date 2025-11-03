import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"
import { redirect } from "next/navigation"

import { getChatbotBySlug } from "@/lib/utils/chatbot-utils"
import TagManagement from "./tag-management"

export default async function TagsPage({ params }) {
  const session = await auth()
  const { chatbot: chatbotParam } = await params
  const chatbotSlug = String(chatbotParam || "")

  if (!session) {
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(
        `/dashboard/${chatbotSlug}/tags`
      )}`
    )
  }

  const chatbot = await getChatbotBySlug(
    chatbotSlug,
    session.strapiToken,
    session.user.strapiUserId
  )

  if (!chatbot) {
    redirect("/select")
  }

  const qs = new URLSearchParams()
  qs.set("filters[chatbot][documentId][$eq]", chatbot.documentId);

  const url = buildStrapiUrl(`/api/tags?${qs.toString()}`)

  let tags = []
  let loadError = null

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.strapiToken}`,
      },
      cache: "no-store",
    })
    console.log("Fetched Url:", url);
    if (!res.ok) {
      const details = await res.json().catch(() => ({}))
      loadError =
        details?.error?.message ||
        `No se pudieron cargar las etiquetas (status ${res.status}).`
    } else {
      const data = await res.json()
      tags = Array.isArray(data) ? data : data?.data || []
    }
  } catch (error) {
    loadError = "Error al conectar con Strapi. Verifica tu conexion."
  }

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Etiquetas</h1>
          <p className="text-sm text-muted-foreground">
            Administra las etiquetas que facilitan la clasificacion de clientes y conversaciones.
          </p>
        </div>

        {loadError && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            {loadError}
          </div>
        )}

        <TagManagement
          initialTags={tags}
          token={session.strapiToken}
          chatbotId={chatbot.documentId}
        />
      </div>
    </div>
  )
}
