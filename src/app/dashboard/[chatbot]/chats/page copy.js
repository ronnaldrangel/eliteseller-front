import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"
import IframeWithPreloader from "@/components/iframe-with-preloader"

export default async function ChatsPage({ params }) {
  // Ya no usamos params para filtrar cuentas; se mantiene la firma
  const session = await auth()
  const userMeUrl = buildStrapiUrl('/api/users/me')
  let channelRawPayload = null
  let channelError = null
  try {
    const resChan = await fetch(userMeUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.strapiToken ? { 'Authorization': `Bearer ${session.strapiToken}` } : {}),
      },
      cache: 'no-store',
    })
    const dataChan = await resChan.json().catch(() => ({}))
    if (!resChan.ok) {
      channelError = dataChan?.error?.message || `No se pudo cargar user/me (status ${resChan.status})`
      channelRawPayload = dataChan
    } else {
      channelRawPayload = dataChan
    }
  } catch (e) {
    channelError = 'Error al conectar con Strapi para user/me.'
  }

  // Wazend login URL using crm_id from Strapi user
  let loginUrl = null
  let loginError = null
  const accountIdCrm = Array.isArray(channelRawPayload?.data) && channelRawPayload.data.length
    ? channelRawPayload.data[0]?.crm_id
    : (channelRawPayload?.crm_id ?? null)

  const userId = typeof accountIdCrm === 'number' ? accountIdCrm : Number(accountIdCrm)
  if (!userId || Number.isNaN(userId)) {
    loginError = 'No se encontró un crm_id válido en user/me.'
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

            <div className="relative w-full h-[calc(100vh-8rem)] bg-background rounded-md border">
              <IframeWithPreloader
                src={loginUrl || "https://crm.eliteseller.app/"}
                title="Chats embebidos"
                className="w-full h-full"
              />
            </div>

            {/* <div className="rounded-lg border bg-muted/20 p-4 mt-4">
                  <h3 className="mb-2 text-sm font-medium">Payload del GET /api/users/me</h3>
                  {channelError ? (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">{channelError}</div>
                  ) : (
                    <pre className="text-xs whitespace-pre-wrap break-words">{channelRawPayload ? JSON.stringify(channelRawPayload, null, 2) : 'Sin contenido'}</pre>
                  )}
                </div> */}


          </div>

        </div>
      </div>
    </div>
  );
}