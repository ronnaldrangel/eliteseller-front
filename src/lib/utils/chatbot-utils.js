// lib/chatbot-utils.js
import { buildStrapiUrl } from "@/lib/strapi";

/**
 * Obtiene el documentId de un chatbot por su slug
 * @param {string} slug - El slug del chatbot
 * @param {string} token - Token de autenticación de Strapi
 * @param {string} userId - ID del usuario (opcional, para validar permisos)
 * @returns {Promise<string|null>} - El documentId del chatbot o null si no se encuentra
 */
export async function getChatbotBySlug(slug, token, userId = null) {
  if (!slug || !token) return null;

  try {
    const filters = [`filters[slug][$eq]=${encodeURIComponent(slug)}`];

    if (userId) {
      filters.push(`filters[users_permissions_user][id][$eq]=${userId}`);
    }

    const chatbotUrl = buildStrapiUrl(
      `/api/chatbots?${filters.join(
        "&"
      )}&fields[0]=documentId&fields[1]=id&fields[2]=slug&fields[3]=chatbot_name`
    );

    const res = await fetch(chatbotUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    const chatbots = Array.isArray(data) ? data : data?.data || [];

    if (chatbots.length > 0) {
      return {
        documentId: chatbots[0].documentId || chatbots[0].id,
        id: chatbots[0].id,
        slug: chatbots[0].slug,
        name: chatbots[0].chatbot_name,
      };
    }

    return null;
  } catch (e) {
    console.error("Error fetching chatbot by slug:", e);
    return null;
  }
}
