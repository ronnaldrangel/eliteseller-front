
import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"
import { redirect } from "next/navigation"
import { columns } from "@/app/dashboard/[chatbot]/products/columns"
import { ProductsClientTable } from "@/app/dashboard/[chatbot]/products/client-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ProductsPage({ params }) {
  const session = await auth()
  const { chatbot: chatbotParam } = await params
  const chatbotDocumentId = String(chatbotParam || '')

  if (!session) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/dashboard/${chatbotDocumentId}/products`)}`)
  }

  // Build Strapi query; filter ONLY by chatbot documentId from URL
  const qs = new URLSearchParams()
  if (chatbotDocumentId) {
    qs.set('filters[chatbot][documentId][$eq]', chatbotDocumentId)
  }

  const url = buildStrapiUrl(`/api/products?${qs.toString()}&populate=media`)

  let products = []
  let error = null
  let rawPayload = null

  try {
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
      error = details?.error?.message || `No se pudo cargar productos (status ${res.status})`
      rawPayload = details
    } else {
      const data = await res.json()
      products = Array.isArray(data) ? data : (data?.data || [])
      rawPayload = data
    }
  } catch (e) {
    error = 'Error al conectar con Strapi. Verifica tu conexión.'
  }

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-2">

        <div className="flex items-center justify-between py-4 md:py-6">
          <div>
            <h1 className="text-2xl font-semibold">Productos registrados</h1>
            <p className="text-sm text-muted-foreground mt-2">Visualiza, edita y gestiona todos los productos de tu tienda.</p>
          </div>
          <Button asChild>
            <Link href={`/dashboard/${encodeURIComponent(chatbotDocumentId)}/products/new`} className="whitespace-nowrap">Crear producto</Link>
          </Button>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        ) : (
          <ProductsClientTable columns={columns} data={products} />
        )}
        <div className="rounded-lg border bg-muted/20 p-4 mt-4">
          <h3 className="mb-2 text-sm font-medium">Payload del GET /api/products</h3>
          <pre className="text-xs whitespace-pre-wrap break-words">{rawPayload ? JSON.stringify(rawPayload, null, 2) : 'Sin contenido'}</pre>
        </div>
      </div>
    </div>
  )
}