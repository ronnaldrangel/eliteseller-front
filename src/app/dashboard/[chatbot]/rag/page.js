import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils"
import { buildStrapiUrl } from "@/lib/strapi"
import RagPageClient from "./rag-page-client"

export default async function RagPage({ params }) {
  const session = await auth()
  const p = await params
  const chatbotSlug = String(p?.chatbot || "")

  if (!session) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/dashboard/${chatbotSlug}/rag`)}`)
  }

  const chatbot = await getChatbotBySlug(
    chatbotSlug,
    session.strapiToken,
    session.user?.strapiUserId
  )
  if (!chatbot) redirect("/select")

  let existingFiles = []
  let chatbotId = null
  let chatbotDocumentId = null
  let loadError = null
  try {
    const qs = new URLSearchParams()
    qs.set("filters[documentId][$eq]", chatbot.documentId)
    qs.set("populate[rag][fields][0]", "url")
    qs.set("populate[rag][fields][1]", "name")
    qs.set("populate[rag][fields][2]", "mime")
    qs.set("populate[rag][fields][3]", "createdAt")

    const res = await fetch(buildStrapiUrl(`/api/chatbots?${qs.toString()}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.strapiToken}`,
      },
      cache: "no-store",
    })
    if (res.ok) {
      const payload = await res.json().catch(() => ({}))
      const row = Array.isArray(payload?.data) ? payload.data[0] : payload?.data || null
      const attrs = row?.attributes || row || {}
      chatbotId = row?.id || null
      chatbotDocumentId = row?.documentId || attrs?.documentId || chatbot.documentId || null
      const mediaItems = attrs?.rag?.data || attrs?.rag || []
      existingFiles = mediaItems.map((m) => {
        const a = m.attributes || m || {}
        return {
          id: m.id || a.id,
          name: a.name || `archivo-${m.id}`,
          url: a.url || null,
          mime: a.mime || null,
          createdAt: a.createdAt || null,
        }
      })
    } else {
      const body = await res.json().catch(() => ({}))
      loadError = body?.error?.message || `No se pudo cargar RAG (status ${res.status})`
    }
  } catch (_) {}

  return (
    <RagPageClient
      chatbotSlug={chatbot.slug}
      chatbotId={chatbotId}
      chatbotDocumentId={chatbotDocumentId}
      token={session.strapiToken}
      existingFiles={existingFiles}
      loadError={loadError}
    />
  )
}

