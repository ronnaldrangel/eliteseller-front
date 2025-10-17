import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ProductsClientTable } from "./client-table"
import { columns } from "./columns"
import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ProductsPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/login?callbackUrl=/products')
  }

  let payload = null
  let error = null

  try {
    const userId = session?.user?.strapiUserId
    const url = buildStrapiUrl(`/api/chatbots?populate=products&filters[users_permissions_user][id][$eq]=${encodeURIComponent(userId)}`)
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
      payload = details
      error = details?.error?.message || `No se pudo obtener datos (status ${res.status})`
    } else {
      payload = await res.json()
    }
  } catch (e) {
    error = 'Error al conectar con Strapi. Verifica tu conexión.'
  }

  // Extraer y ordenar productos
  const chatbots = Array.isArray(payload) ? payload : (payload?.data || [])
  const productsRows = []

  for (const item of chatbots) {
    const attrs = item?.attributes || item || {}
    const chatbotName = attrs.chatbot_name || attrs.name || attrs.title || `Chatbot #${item?.id || ''}`
    const productsRel = attrs?.products

    let productsRaw = []
    if (Array.isArray(productsRel)) {
      productsRaw = productsRel
    } else if (productsRel?.data && Array.isArray(productsRel.data)) {
      productsRaw = productsRel.data.map((p) => (p?.attributes ? { ...p.attributes, id: p.id } : p))
    }

    for (const p of productsRaw) {
      const pr = p?.attributes || p || {}
      productsRows.push({
        id: pr?.id ?? p?.id,
        name: pr?.name || '',
        price: pr?.price ?? 0,
        available: pr?.available ?? false,
        stock: pr?.stock ?? 0,
        updatedAt: pr?.updatedAt || '',
        chatbot: chatbotName,
      })
    }
  }

  productsRows.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col px-4 lg:px-6">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between py-4 md:py-6">
              <div>
                <h1 className="text-2xl font-semibold">Productos registrados</h1>
                <p className="text-sm text-muted-foreground mt-2">Visualiza, edita y gestiona todos los productos de tu tienda.</p>
              </div>
              <Button asChild>
                <Link href="/products/new" className="whitespace-nowrap">Crear producto</Link>
              </Button>
            </div>

            {/* <div className="px-4 lg:px-6">
              <div className="rounded-lg border bg-muted/20 p-4">
                {error ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
                    {error}
                  </div>
                ) : (
                  <pre className="text-xs whitespace-pre-wrap break-words">
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                )}
              </div>
            </div> */}

            <div>
              <ProductsClientTable columns={columns} data={productsRows} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}