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

  const [contacts, triggers, products] = await Promise.all([
    fetchCollectionCount("contacts", session.strapiToken, chatbotDocumentId),
    fetchCollectionCount("triggers", session.strapiToken, chatbotDocumentId),
    fetchCollectionCount("products", session.strapiToken, chatbotDocumentId),
  ]);

  return NextResponse.json({
    data: {
      stats: {
        contacts,
        triggers,
        products,
      },
    },
  });
}
