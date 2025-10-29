import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"

export async function DELETE(request, { params }) {
  const session = await auth()
  if (!session?.strapiToken) {
    return new Response(JSON.stringify({ error: { message: "No autorizado" } }), { status: 401 })
  }

  const { id } = params || {}
  const documentId = String(id || "")
  if (!documentId) {
    return new Response(JSON.stringify({ error: { message: "documentId de producto faltante" } }), { status: 400 })
  }

  try {
    const res = await fetch(buildStrapiUrl(`/api/products/${documentId}`), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.strapiToken}`,
      },
    })

    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      return new Response(JSON.stringify(body), { status: res.status })
    }
    return new Response(JSON.stringify(body), { status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ error: { message: "Error de red al eliminar" } }), { status: 500 })
  }
}