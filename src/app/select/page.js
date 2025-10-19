import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function SelectPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/login?callbackUrl=/select')
  }

  let chatbots = []
  let error = null

  try {
    const userId = session?.user?.strapiUserId
    const url = buildStrapiUrl(`/api/chatbots?filters[users_permissions_user][id][$eq]=${encodeURIComponent(userId)}`)
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
      error = details?.error?.message || `No se pudo cargar tus chatbots (status ${res.status})`
    } else {
      const data = await res.json()
      chatbots = Array.isArray(data) ? data : (data?.data || [])
    }
  } catch (e) {
    error = 'Error al conectar con Strapi. Verifica tu conexión.'
  }

  // Si el usuario tiene al menos un chatbot, redirige automáticamente al primero usando documentId
  if (!error && Array.isArray(chatbots) && chatbots.length > 0) {
    const first = chatbots[0]
    const firstRouteId = String(first?.documentId ?? first?.id ?? '')
    if (firstRouteId) {
      redirect(`/dashboard/${encodeURIComponent(firstRouteId)}/home`)
    }
  }

  const cards = Array.isArray(chatbots) ? chatbots.map((item) => {
    const attrs = item?.attributes || {}
    const routeId = String(item?.documentId ?? item?.id ?? '')
    const displayId = (typeof item?.id !== 'undefined' && item?.id !== null) ? String(item.id) : ''
    const name = attrs.chatbot_name || item?.chatbot_name || attrs.name || attrs.title || attrs.slug || `Chatbot #${displayId || routeId}`
    const description = attrs.description || ''
    return { routeId, displayId, name, description }
  }) : []

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto w-full max-w-6xl px-4 lg:px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Selecciona tu chatbot</h1>
            <p className="text-sm text-muted-foreground mt-2">Elige con cuál quieres trabajar para continuar.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/assistant" className="whitespace-nowrap">Crear chatbot</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          ) : (
            cards.length > 0 ? (
              cards.map((c) => (
                <div key={c.routeId} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{c.name}</h3>
                  </div>
                  {c.displayId && (
                    <p className="mt-1 text-xs text-muted-foreground">ID: {c.displayId}</p>
                  )}
                  {c.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                  )}
                  <div className="mt-4">
                    <Button asChild>
                      <Link href={`/dashboard/${encodeURIComponent(c.routeId)}/home`}>Entrar</Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">No tienes chatbots asociados todavía.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}