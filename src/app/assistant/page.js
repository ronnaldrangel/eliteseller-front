import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"
import { redirect } from "next/navigation"
import ChatbotEditForm from "@/components/chatbot-edit-form"

export default async function AppsPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/login?callbackUrl=/assistant')
  }

  let chatbots = []
  let error = null
  let rawPayload = null

  try {
    const userId = session?.user?.strapiUserId
    const url = buildStrapiUrl('/api/chatbots')
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.strapiToken}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const details = await res.json().catch(() => ({}))
      rawPayload = details
      error = details?.error?.message || `No se pudo cargar tus chatbots (status ${res.status})`
    } else {
      const data = await res.json()
      rawPayload = data
      chatbots = Array.isArray(data) ? data : (data?.data || [])
    }
  } catch (e) {
    error = 'Error al conectar con Strapi. Verifica tu conexión.'
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-2xl font-semibold">Configuración de tu vendedor</h1>
                <p className="text-sm text-muted-foreground mt-2">Edita la información y preferencias de tu vendedor.</p>
              </div>
            </div>

            <div className="px-4 lg:px-6">

              {error ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
                  {error}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.isArray(chatbots) && chatbots.length > 0 ? (
                    chatbots.map((item) => {
                      const attrs = item?.attributes || {}
                      const name = attrs.name || attrs.title || attrs.slug || `Chatbot #${item?.id}`
                      const description = attrs.description || ''
                      return (
                        <div key={item?.id || name} className="rounded-lg border bg-card p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{name}</h3>
                            {attrs?.updatedAt && (
                              <span className="text-xs text-muted-foreground">{new Date(attrs.updatedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                          {description && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <p className="text-sm text-muted-foreground">No tienes chatbots asociados todavía.</p>
                    </div>
                  )}
                </div>
              )}

              {/* <div className="mt-6 rounded-lg border bg-muted/10 p-4">
                <h3 className="mb-2 text-sm font-medium">Payload del GET /api/chatbots</h3>
                <pre className="text-xs whitespace-pre-wrap break-words">{rawPayload ? JSON.stringify(rawPayload, null, 2) : 'Sin contenido'}</pre>
              </div> */}

              {Array.isArray(chatbots) && chatbots.length > 0 && (
                <div className="my-6">
                  <ChatbotEditForm
                    initialData={(chatbots[0]?.attributes || chatbots[0] || {})}
                    chatbotId={chatbots[0]?.documentId}
                    token={session.strapiToken}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}