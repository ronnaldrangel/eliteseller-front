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
    const authHeaders = { Authorization: `Bearer ${session.strapiToken}` }

    const buildFilterUrl = (path) => {
      const qs = new URLSearchParams()
      qs.set("filters[product][documentId][$eq]", documentId)
      qs.set("pagination[pageSize]", "1000")
      return `${path}?${qs.toString()}`
    }

    const fetchIdsFor = async (collectionPath) => {
      const res = await fetch(buildStrapiUrl(buildFilterUrl(collectionPath)), {
        method: "GET",
        headers: authHeaders,
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload?.error?.message || `No se pudieron obtener ${collectionPath}`)
      }
      const list = Array.isArray(payload?.data) ? payload.data : []
      return list
        .map((item) => item?.documentId || item?.id || item?.attributes?.documentId)
        .filter(Boolean)
    }

    // Eliminar variantes y opciones antes de eliminar el producto principal
    const [variantIds, optionIds] = await Promise.all([
      fetchIdsFor("/api/product-variants"),
      fetchIdsFor("/api/product-options"),
    ])

    const deleteByIds = async (ids, collectionPath) => {
      const results = await Promise.allSettled(
        ids.map(async (itemId) => {
          const res = await fetch(buildStrapiUrl(`${collectionPath}/${itemId}`), {
            method: "DELETE",
            headers: authHeaders,
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err?.error?.message || `Fallo eliminando ${collectionPath}`)
          }
        })
      )

      const failed = results.filter((r) => r.status === "rejected")
      if (failed.length) {
        throw new Error(`No se pudieron eliminar algunos registros de ${collectionPath}`)
      }
    }

    if (variantIds.length) {
      await deleteByIds(variantIds, "/api/product-variants")
    }
    if (optionIds.length) {
      await deleteByIds(optionIds, "/api/product-options")
    }

    const res = await fetch(buildStrapiUrl(`/api/products/${documentId}`), {
      method: "DELETE",
      headers: authHeaders,
    })

    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      return new Response(JSON.stringify(body), { status: res.status })
    }
    return new Response(JSON.stringify(body), { status: 200 })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: { message: e?.message || "Error de red al eliminar" } }),
      { status: 500 }
    )
  }
}
