import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"
import IframeWithPreloader from "@/components/iframe-with-preloader"

export default async function ChatsPage({ params }) {
  const p = await params
  const chatbotDocumentId = String(p?.chatbot || '')

  // Strapi channel payload filtered by chatbot documentId
  const session = await auth()
  const qs = new URLSearchParams()
  if (chatbotDocumentId) {
    qs.set('filters[chatbot][documentId][$eq]', chatbotDocumentId)
  }
  const channelUrl = buildStrapiUrl(`/api/accounts?${qs.toString()}`)

  let channelRawPayload = null
  let channelError = null
  try {
    const resChan = await fetch(channelUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.strapiToken ? { 'Authorization': `Bearer ${session.strapiToken}` } : {}),
      },
      cache: 'no-store',
    })
    const dataChan = await resChan.json().catch(() => ({}))
    if (!resChan.ok) {
      channelError = dataChan?.error?.message || `No se pudo cargar channel (status ${resChan.status})`
      channelRawPayload = dataChan
    } else {
      channelRawPayload = dataChan
    }
  } catch (e) {
    channelError = 'Error al conectar con Strapi para channel.'
  }

  // Wazend login URL using id_account from Strapi channel
  let loginUrl = null
  let loginError = null
  const accountIdCrm = Array.isArray(channelRawPayload?.data) && channelRawPayload.data.length
    ? channelRawPayload.data[0]?.id_account
    : null

  const userId = typeof accountIdCrm === 'number' ? accountIdCrm : Number(accountIdCrm)
  if (!userId || Number.isNaN(userId)) {
    loginError = 'No se encontró un id_account válido en channel.'
  } else {
    try {
      const res = await fetch(`https://crm.eliteseller.app/platform/api/v1/users/${userId}/login`, {
        method: 'GET',
        headers: { 'api_access_token': 'ZseUZfnHyMzwFWGbHjgnsvSh' },
        cache: 'no-store',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        loginError = data?.error?.message || `No se pudo obtener login (status ${res.status})`
      } else {
        loginUrl = data?.url || null
      }
    } catch (e) {
      loginError = 'Error de red al conectar con Wazend'
    }
  }

  return (
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-2xl font-semibold">Chats</h1>
                <p className="text-sm text-muted-foreground mt-2">Tus conversaciones y asistentes.</p>
              </div>
              <div className="px-4 lg:px-6">
                {loginError && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm mb-2">
                    {loginError}
                  </div>
                )}
                <Button asChild>
                  <Link href={loginUrl || "https://crm.eliteseller.app/"} target="_blank" rel="noopener noreferrer">
                    Accede a tus chats
                  </Link>
                </Button>
                <div className="rounded-lg border bg-muted/20 p-4 mt-4">
                  <h3 className="mb-2 text-sm font-medium">Payload del GET /api/accounts</h3>
                  {channelError ? (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">{channelError}</div>
                  ) : (
                    <pre className="text-xs whitespace-pre-wrap break-words">{channelRawPayload ? JSON.stringify(channelRawPayload, null, 2) : 'Sin contenido'}</pre>
                  )}
                </div>

                <div className="rounded-lg border bg-muted/20 p-4 mt-4">
                  <h3 className="mb-2 text-sm font-medium">Vista embebida de chats</h3>
                  <div className="w-full h-[600px] rounded-md overflow-hidden border bg-muted/30">
                    <IframeWithPreloader
                      src={loginUrl || "https://crm.eliteseller.app/"}
                      title="Chats embebidos"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}