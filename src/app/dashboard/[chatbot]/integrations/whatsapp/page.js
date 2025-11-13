import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils"
import { redirect } from "next/navigation"
import ConnectWhatsAppButton from "@/components/connect-whatsapp-button"

export default async function WhatsAppIntegrationPage({ params }) {
  const session = await auth()
  const p = await params
  const chatbotSlug = String(p?.chatbot || "")

  if (!session) {
    redirect(`/auth/login?callbackUrl=/dashboard/${chatbotSlug}/integrations/whatsapp`)
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
  qs.set("filters[chatbot][documentId][$eq]", chatbot.documentId)
  const url = buildStrapiUrl(`/api/accounts?${qs.toString()}`)

  let payload = null
  let error = null

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.strapiToken}`,
      },
      cache: "no-store",
    })

    if (!res.ok) {
      const details = await res.json().catch(() => ({}))
      error = details?.error?.message || `No se pudieron cargar las cuentas (status ${res.status})`
    } else {
      const data = await res.json()
      payload = data
    }
  } catch (_) {
    error = "Error al conectar con Strapi. Verifica tu conexión."
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Integración de WhatsApp</h1>
      <p className="text-sm text-muted-foreground mt-1">Cuentas relacionadas con tu chatbot</p>

      {/* {error ? (
        <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      ) : (
        <div className="mt-4">
          <div className="rounded-md border bg-muted/10 p-4">
            <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(payload, null, 2)}</pre>
          </div>
        </div>
      )} */}

      <div className="mt-6">
        {(() => {
          const items = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
            ? payload.data
            : []
          const first = items[0] || null
          const attrs = first?.attributes || first || {}
          const accountDocumentId = attrs?.documentId || first?.documentId || null
          return <ConnectWhatsAppButton documentId={accountDocumentId} />
        })()}
      </div>
    </div>
  )
}