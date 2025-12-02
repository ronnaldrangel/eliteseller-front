// lib/chatbot-utils.js
import { buildStrapiUrl } from "@/lib/strapi"
import {
  buildChatbotIdentifiers,
  matchesChatbotRouteSegment,
} from "@/lib/utils/chatbot-route"

/**
 * Fetches a chatbot using the safe route segment.
 * Returns null when the segment does not belong to the current user.
 */
export async function getChatbotBySlug(segment, token, userId = null) {
  if (!segment || !token) return null

  const params = new URLSearchParams()
  params.set("fields[0]", "documentId")
  params.set("fields[1]", "id")
  params.set("fields[2]", "slug")
  params.set("fields[3]", "chatbot_name")
  params.set("fields[4]", "isWhatsAppConnected")

   if (userId) {
     params.set("filters[users_permissions_user][id][$eq]", userId)
   } else {
    params.set("filters[slug][$eq]", segment)
   }

  const res = await fetch(buildStrapiUrl(`/api/chatbots?${params.toString()}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  })

  if (!res.ok) return null

  const payload = await res.json()
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
    ? payload.data
    : payload?.data
    ? [payload.data]
    : []

  if (!items.length) return null

  const match =
    (userId &&
      items.find((item) =>
        matchesChatbotRouteSegment(segment, item, userId)
      )) ||
    items.find((item) => {
      const meta = buildChatbotIdentifiers(item, userId || "")
      return meta.slug && meta.slug === segment
    })

  if (!match) return null

  const meta = buildChatbotIdentifiers(match, userId || "")

  if (!meta.documentId) return null

  return {
    documentId: meta.documentId,
    id: meta.id || meta.documentId,
    slug: meta.slug || meta.documentId,
    routeSegment: meta.routeSegment,
    name: meta.name || meta.routeSegment,
    isWhatsAppConnected: items[0].isWhatsAppConnected || false,
  }
}
