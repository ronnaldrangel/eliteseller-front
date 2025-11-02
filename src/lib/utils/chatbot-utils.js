// lib/chatbot-utils.js
import { buildStrapiUrl } from "@/lib/strapi";

/**
 * Obtiene el documentId de un chatbot por su slug
 * @param {string} slug - El slug del chatbot
 * @param {string} token - Token de autenticación de Strapi
 * @param {string} userId - ID del usuario (opcional, para validar permisos)
 * @returns {Promise<string|null>} - El documentId del chatbot o null si no se encuentra
 */
// src/lib/utils/chatbot-utils.js
export async function getChatbotBySlug(slug, token, userId = null) {
  if (!slug || !token) return null;

  const filters = [`filters[slug][$eq]=${encodeURIComponent(slug)}`];
  if (userId) {
    filters.push(`filters[users_permissions_user][id][$eq]=${encodeURIComponent(userId)}`);
  }

  const res = await fetch(
    buildStrapiUrl(
      `/api/chatbots?${filters.join('&')}` +
        `&fields[0]=documentId&fields[1]=id&fields[2]=slug&fields[3]=chatbot_name`
    ),
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) return null;

  const payload = await res.json();
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
    ? payload.data
    : payload?.data
    ? [payload.data]
    : [];

  const first = items[0];
  if (!first) return null;

  const attrs = first.attributes ?? first;
  const documentId =
    first.documentId ??
    attrs.documentId ??
    first.id ??
    attrs.id;

  if (!documentId) return null;

  return {
    documentId: String(documentId),
    id: String(first.id ?? attrs.id ?? documentId),
    slug: attrs.slug ?? first.slug ?? slug,
    name: attrs.chatbot_name ?? first.chatbot_name ?? slug,
  };
}

