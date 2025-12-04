import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils";

async function fetchCollectionCount(collection, token, chatbotDocumentId) {
  const qs = new URLSearchParams();
  qs.set("pagination[page]", "1");
  qs.set("pagination[pageSize]", "1");
  qs.set("pagination[withCount]", "true");
  qs.set("fields[0]", "id");
  qs.set("populate", "false"); // Deshabilitar populate para mejor rendimiento

  if (chatbotDocumentId) {
    qs.set("filters[chatbot][documentId][$eq]", chatbotDocumentId);
  }

  const url = buildStrapiUrl(`/api/${collection}?${qs.toString()}`);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(
        `[dashboard/stats] No se pudo contar ${collection} (status ${res.status})`
      );
      return 0;
    }

    const payload = await res.json().catch(() => ({}));
    const total = payload?.meta?.pagination?.total;
    if (typeof total === "number") {
      return total;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data.length;
    }

    if (Array.isArray(payload)) {
      return payload.length;
    }

    return 0;
  } catch (error) {
    console.error(
      `[dashboard/stats] Error al contar ${collection}:`,
      error?.message || error
    );
    return 0;
  }
}

async function fetchContactsSeries(token, chatbotDocumentId) {
  const buckets = new Map();
  const since = new Date();
  since.setDate(since.getDate() - 90); // Reducido de 120 a 90 días
  const sinceIso = since.toISOString();

  const pageSize = 500; // Aumentado de 200 a 500 para menos peticiones
  let page = 1;
  let pageCount = 1;

  do {
    const qs = new URLSearchParams();
    qs.set("pagination[page]", String(page));
    qs.set("pagination[pageSize]", String(pageSize));
    qs.set("sort", "createdAt:asc");
    qs.set("fields[0]", "createdAt");
    qs.set("populate", "false"); // Deshabilitar populate para mejor rendimiento
    qs.set("filters[createdAt][$gte]", sinceIso);
    if (chatbotDocumentId) {
      qs.set("filters[chatbot][documentId][$eq]", chatbotDocumentId);
    }

    const url = buildStrapiUrl(`/api/contacts?${qs.toString()}`);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        console.error(
          `[dashboard/stats] No se pudo obtener la serie de contactos (status ${res.status})`
        );
        break;
      }

      const payload = await res.json().catch(() => ({}));
      const rows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

      rows.forEach((row) => {
        const createdAt =
          row?.attributes?.createdAt ||
          row?.createdAt ||
          row?.attributes?.created_at;
        if (!createdAt) return;
        const day = createdAt.split("T")[0];
        if (!day) return;
        buckets.set(day, (buckets.get(day) || 0) + 1);
      });

      const pagination = payload?.meta?.pagination;
      if (!pagination) {
        break;
      }
      pageCount = pagination.pageCount || page;
      page += 1;
    } catch (error) {
      console.error(
        "[dashboard/stats] Error al obtener contactos para la serie:",
        error?.message || error
      );
      break;
    }
  } while (page <= pageCount);

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, count]) => ({ date, count }));
}

export async function GET(request) {
  const session = await auth();

  if (!session?.strapiToken) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const chatbotSegment = searchParams.get("chatbot");
  let chatbotDocumentId = null;

  if (chatbotSegment) {
    const chatbot = await getChatbotBySlug(
      chatbotSegment,
      session.strapiToken,
      session.user?.strapiUserId
    );

    if (!chatbot) {
      return NextResponse.json(
        { error: "Chatbot no encontrado" },
        { status: 404 }
      );
    }

    chatbotDocumentId = chatbot.documentId;
  }

  const [contacts, triggers, products, contactSeries] = await Promise.all([
    fetchCollectionCount("contacts", session.strapiToken, chatbotDocumentId),
    fetchCollectionCount("triggers", session.strapiToken, chatbotDocumentId),
    fetchCollectionCount("products", session.strapiToken, chatbotDocumentId),
    fetchContactsSeries(session.strapiToken, chatbotDocumentId),
  ]);

  return NextResponse.json({
    data: {
      stats: {
        contacts,
        triggers,
        products,
      },
      contactSeries,
    },
  });
}
