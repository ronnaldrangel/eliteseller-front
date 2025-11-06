import md5 from "blueimp-md5"

/**
 * Normaliza un registro de chatbot (ya sea plano o con attributes de Strapi)
 * para obtener identificadores consistentes.
 */
export function normalizeChatbotRecord(raw = {}) {
  const attrs = raw?.attributes || {}

  const documentId = raw?.documentId ?? attrs.documentId ?? raw?.id ?? attrs.id ?? ""
  const id = raw?.id ?? attrs.id ?? documentId ?? ""
  const slug = attrs.slug ?? raw?.slug ?? ""
  const name =
    attrs.chatbot_name ||
    raw?.chatbot_name ||
    attrs.name ||
    attrs.title ||
    (typeof slug === "string" && slug.trim().length > 0 ? slug : `Chatbot #${id || documentId}`)

  return {
    documentId: documentId ? String(documentId) : "",
    id: id ? String(id) : "",
    slug: slug ? String(slug) : "",
    name: name ? String(name) : "",
  }
}

/**
 * Calcula el segmento seguro que se debe usar en la URL para un chatbot.
 * Si el chatbot tiene un slug propio distinto a su documentId se respeta,
 * de lo contrario se genera un hash estable usando el ID del usuario.
 */
export function computeChatbotRouteSegment(raw = {}, userId = "") {
  const { documentId, slug } = normalizeChatbotRecord(raw)
  if (!documentId) return ""

  if (slug && slug !== documentId) {
    return slug
  }

  const salt = userId ? String(userId) : "public"
  return md5(`${salt}:${documentId}`)
}

/**
 * Verifica si un segmento de ruta pertenece al chatbot indicado.
 */
export function matchesChatbotRouteSegment(segment, raw = {}, userId = "") {
  if (!segment) return false

  const candidate = String(segment).toLowerCase()
  const { slug, documentId, id } = normalizeChatbotRecord(raw)

  if (slug && candidate === slug.toLowerCase()) {
    return true
  }
  if (documentId && candidate === documentId.toLowerCase()) {
    return true
  }
  if (id && candidate === id.toLowerCase()) {
    return true
  }

  const safeSegment = computeChatbotRouteSegment(raw, userId)
  return safeSegment && candidate === safeSegment.toLowerCase()
}

/**
 * Devuelve un objeto auxiliar con los identificadores principales y
 * el segmento seguro calculado.
 */
export function buildChatbotIdentifiers(raw = {}, userId = "") {
  const base = normalizeChatbotRecord(raw)
  const routeSegment = computeChatbotRouteSegment(raw, userId)
  return {
    ...base,
    routeSegment,
  }
}
