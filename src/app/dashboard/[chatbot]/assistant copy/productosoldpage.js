import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ProductsClientTable } from "./client-table"
import { columns } from "../dashboard/[chatbot]/products/columns"
import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ProductsPage({ searchParams }) {
  const session = await auth()

  if (!session) {
    redirect('/auth/login?callbackUrl=/products')
  }

  let payload = null
  let error = null

  try {
    const userId = session?.user?.strapiUserId
    const params = await searchParams
    const selectedChatbotId = params?.chatbot

    // Construir la URL según haya chatbot seleccionado o no
    let endpoint = ''
    if (selectedChatbotId) {
      endpoint = `/api/products?filters[chatbot][id][$eq]=${encodeURIComponent(selectedChatbotId)}`
    } else {
      // Fallback: listar productos de los chatbots del usuario
      endpoint = `/api/products?filters[chatbot][users_permissions_user][id][$eq]=${encodeURIComponent(userId)}`
    }

    const url = buildStrapiUrl(endpoint)
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
  const products = Array.isArray(payload) ? payload : (payload?.data || [])
  const productsRows = []

  for (const p of products) {
    const attrs = p?.attributes || p || {}
    productsRows.push({
      id: p?.id ?? attrs?.id,
      name: attrs?.name || '',
      price: attrs?.price ?? 0,
      available: attrs?.available ?? false,
      stock: attrs?.stock ?? 0,
    })
  }

  productsRows.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

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