import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import { redirect } from "next/navigation";
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils";
import DocsPageClient from "./docsPageClient";

export default async function DashboardPage({ params }) {
  const session = await auth();
  const { chatbot: chatbotParam } = await params;
  const chatbotSlug = String(chatbotParam || "");

  if (!session) {
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(`/dashboard/${chatbotSlug}`)}`
    );
  }

  const chatbot = await getChatbotBySlug(
    chatbotSlug,
    session.strapiToken,
    session.user.strapiUserId
  );

  const friendlyChatbotName = chatbot.name || chatbot.routeSegment;

  if (!chatbot) redirect("/select");

  const qs = new URLSearchParams();
  qs.set("sort", "createdAt:desc");
  qs.set("fields[0]", "title");
  qs.set("fields[1]", "description");
  qs.set("fields[2]", "cta");
  qs.set("fields[3]", "href");
  qs.set("fields[4]", "imageAlt");
  qs.set("populate[image][fields][0]", "url");
  qs.set("populate[image][fields][1]", "name");

  const url = buildStrapiUrl(`/api/cards?${qs.toString()}`);

  const toAbsUrl = (u) => (!u ? "" : u.startsWith("http") ? u : buildStrapiUrl(u));

  let cards = [];
  let cardsError = null;
  let messageStats = { tokensRemaining: null, tokensUsed: null };

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.strapiToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const details = await res.json().catch(() => ({}));
      cardsError =
        details?.error?.message ||
        `No se pudieron cargar las cards (status ${res.status})`;
    } else {
      const data = await res.json();
      const nodes = Array.isArray(data) ? data : data?.data || [];
      cards = nodes.map((n) => {
        const a = n?.attributes || {};
        const img = n?.image || {};
        return {
          id: n?.id,
          title: n?.title || "",
          description: n?.description || "",
          cta: n?.cta || "",
          href: n?.href || "#",
          image: toAbsUrl(img?.url),
          imageAlt: n?.imageAlt || "",
        };
      });
    }
  } catch {
    cardsError = "Error al conectar. Verifica tu conexión.";
  }

  try {
    const qsChatbot = new URLSearchParams();
    qsChatbot.set("filters[documentId][$eq]", chatbot.documentId);
    qsChatbot.set("fields[0]", "tokens_remaining");
    qsChatbot.set("fields[1]", "tokens_used");

    const usageUrl = buildStrapiUrl(`/api/chatbots?${qsChatbot.toString()}`);
    const usageRes = await fetch(usageUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.strapiToken}`,
      },
      cache: "no-store",
    });

    if (usageRes.ok) {
      const payload = await usageRes.json().catch(() => ({}));
      const row = Array.isArray(payload?.data)
        ? payload.data[0]
        : payload?.data || payload || null;
      const attrs = row?.attributes || row || {};
      messageStats = {
        tokensRemaining: attrs?.tokens_remaining ?? null,
        tokensUsed: attrs?.tokens_used ?? null,
      };
    }
  } catch {
    // Si falla el conteo de mensajes, el dashboard seguira mostrando el resto del contenido.
  }

  return (
    <DocsPageClient
      initialNewsItems={cards}
      newsError={cardsError}
      messageStats={messageStats}
      friendlyChatbotName={friendlyChatbotName}
    />
  );
}

