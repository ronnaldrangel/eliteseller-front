import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"
import { redirect } from "next/navigation"
import Link from "next/link"
import EditProductForm from "./edit-product-form"

export default async function EditProductPage({ params }) {
  const session = await auth()
  const { chatbot: chatbotParam, id: documentId } = await params
  const chatbotDocumentId = String(chatbotParam || "")

  if (!session) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/dashboard/${chatbotDocumentId}/products/${documentId}/edit`)}`)
  }

  let product = null
  let error = null

  try {
    const res = await fetch(buildStrapiUrl(`/api/products/${documentId}?populate[media][fields][0]=url&populate[media][fields][1]=name`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.strapiToken}`,
      },
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      error = data?.error?.message || `No se pudo cargar producto (status ${res.status})`
    } else {
      product = Array.isArray(data) ? data[0] : (data?.data || data)
    }
  } catch (e) {
    error = 'Error al conectar con Strapi. Verifica tu conexión.'
  }

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between py-4 md:py-6">
          <div>
            <h1 className="text-2xl font-semibold">Editar producto</h1>
            {/* <p className="text-sm text-muted-foreground mt-2">DocumentId: {documentId}</p> */}
          </div>
          <Link href={`/dashboard/${encodeURIComponent(chatbotDocumentId)}/products`} className="text-sm underline">Volver a productos</Link>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</div>
        ) : (
          <EditProductForm initialData={product} token={session.strapiToken} chatbotId={chatbotDocumentId} documentId={documentId} />
        )}
      </div>
    </div>
  )
}