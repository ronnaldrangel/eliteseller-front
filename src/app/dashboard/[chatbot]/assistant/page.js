import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils";
import { redirect } from "next/navigation";
import ChatbotEditForm from "@/components/chatbot-edit-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatbotPayments from "@/components/chatbot-payments";
import ChatbotFaqs from "@/components/chatbot-faqs";
import ChatbotAdvancedSettings from "@/components/chatbot-advanced-settings";
import ChatbotReviews from "@/components/chatbot-reviews";
import RagPageClient from "../rag/rag-page-client";

export default async function AppsPage({ params }) {
  const session = await auth();
  const p = await params;
  const chatbotSlug = String(p?.chatbot || "");

  if (!session) {
    redirect(`/auth/login?callbackUrl=/dashboard/${chatbotSlug}/assistant`);
  }

  // Obtener el chatbot por slug
  const chatbot = await getChatbotBySlug(
    chatbotSlug,
    session.strapiToken,
    session.user.strapiUserId
  );

  if (!chatbot) {
    redirect("/select");
  }

  const documentId = chatbot.documentId;

  let chatbots = [];
  let error = null;
  let rawPayload = null;

  try {
    const url = buildStrapiUrl(
      `/api/chatbots/${encodeURIComponent(
        chatbot.slug
      )}?populate[faqs]=true&populate[payments]=true&populate[reviews][populate]=images&populate[rag][fields][0]=url&populate[rag][fields][1]=name&populate[rag][fields][2]=mime&populate[rag][fields][3]=createdAt`
    );
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
      rawPayload = details;
      error =
        details?.error?.message ||
        `No se pudo cargar el chatbot (status ${res.status})`;
    } else {
      const data = await res.json();
      rawPayload = data;
      const single = Array.isArray(data)
        ? data[0] || null
        : data?.data || data || null;
      chatbots = single ? [single] : [];
    }
  } catch (e) {
    error = "Error al conectar con Strapi. Verifica tu conexión.";
  }

  // Derivar pagos a partir del primer chatbot (soporta data en attributes o plano)
  const firstEntity =
    Array.isArray(chatbots) && chatbots.length > 0 ? chatbots[0] : null;
  const attrs = firstEntity?.attributes || firstEntity || {};
  const paymentsItems = Array.isArray(attrs?.payments?.data)
    ? attrs.payments.data
    : Array.isArray(attrs?.payments)
      ? attrs.payments
      : [];
  const faqsItems = Array.isArray(attrs?.faqs?.data)
    ? attrs.faqs.data
    : Array.isArray(attrs?.faqs)
      ? attrs.faqs
      : [];
  const ragItems = Array.isArray(attrs?.rag?.data)
    ? attrs.rag.data
    : Array.isArray(attrs?.rag)
      ? attrs.rag
      : [];
  const ragFiles = ragItems.map((m) => {
    const a = m.attributes || m || {};
    return {
      id: m.id || a.id,
      name: a.name || `archivo-${m.id || a.id}`,
      url: a.url || null,
      mime: a.mime || null,
      createdAt: a.createdAt || null,
    };
  });
  const reviewsItems = Array.isArray(attrs?.reviews?.data)
    ? attrs.reviews.data
    : Array.isArray(attrs?.reviews)
      ? attrs.reviews
      : [];
  const autoAssignement =
    typeof attrs?.auto_assignment === "boolean"
      ? attrs.auto_assignment
      : typeof attrs?.auto_assignement === "boolean"
        ? attrs.auto_assignement
        : !!(attrs?.auto_assignment ?? attrs?.auto_assignement);
  const chatbotSlugForUpdate =
    chatbots[0]?.slug || chatbot.slug || chatbot.documentId;
  const chatbotIdForUpdate = chatbots[0]?.documentId || documentId;
  const chatbotDocumentIdForUpdate =
    chatbots[0]?.documentId || attrs?.documentId || documentId;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6 w-full max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold">
              Configuración de tu vendedor
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Edita la información y preferencias de tu vendedor.
            </p>
          </div>
        </div>

        <div className="px-4 lg:px-6 w-full max-w-7xl mx-auto">
          <Tabs defaultValue="todo" className="w-full">
            <TabsList className="w-full inline-flex sm:grid sm:grid-cols-5 overflow-x-auto">
              <TabsTrigger value="todo" className="flex-1 sm:flex-none whitespace-nowrap">Personalidad</TabsTrigger>
              <TabsTrigger value="faqs" className="flex-1 sm:flex-none whitespace-nowrap">Conocimiento</TabsTrigger>
              <TabsTrigger value="pagos" className="flex-1 sm:flex-none whitespace-nowrap">Pagos</TabsTrigger>
              <TabsTrigger value="rag" className="flex-1 sm:flex-none whitespace-nowrap">RAG</TabsTrigger>
              <TabsTrigger value="avanzado" className="flex-1 sm:flex-none whitespace-nowrap">Avanzado</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="todo" className="space-y-6" forceMount>
                {error ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
                    {error}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.isArray(chatbots) && chatbots.length > 0 ? (
                      chatbots.map((item) => {
                        const attrs = item?.attributes || {};
                        const name =
                          attrs.chatbot_name ||
                          item?.chatbot_name ||
                          attrs.name ||
                          attrs.title ||
                          attrs.slug ||
                          `Chatbot #${item?.id || item?.documentId}`;
                        const description = attrs.description || "";
                        return (
                          <div
                            key={item?.documentId || item?.id || name}
                            className="rounded-lg border bg-card p-4"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">Configuración de {name}</h3>
                              {attrs?.updatedAt && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(
                                    attrs.updatedAt
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {description && (
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                {description}
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-lg border bg-muted/20 p-4">
                        <p className="text-sm text-muted-foreground">
                          No se encontró el chatbot solicitado.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {Array.isArray(chatbots) && chatbots.length > 0 && (
                  <div className="my-2">
                    <ChatbotEditForm
                      initialData={chatbots[0]?.attributes || chatbots[0] || {}}
                      chatbotSlug={
                        chatbots[0]?.slug || chatbot.slug || chatbot.documentId
                      }
                      token={session.strapiToken}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="faqs" forceMount>
                <ChatbotFaqs
                  items={faqsItems}
                  token={session.strapiToken}
                  chatbotId={chatbots[0]?.documentId || documentId}
                />
                <div className="mt-6">
                  <ChatbotReviews
                    items={reviewsItems}
                    token={session.strapiToken}
                    chatbotId={chatbots[0]?.documentId || documentId}
                  />
                </div>
              </TabsContent>
              <TabsContent value="pagos" forceMount>
                <ChatbotPayments
                  items={paymentsItems}
                  token={session.strapiToken}
                  chatbotId={chatbots[0]?.documentId || documentId}
                />
              </TabsContent>
              <TabsContent value="rag" forceMount>
                <RagPageClient
                  chatbotSlug={chatbot.slug}
                  chatbotId={chatbots[0]?.id || chatbots[0]?.documentId || documentId}
                  chatbotDocumentId={chatbotDocumentIdForUpdate}
                  token={session.strapiToken}
                  existingFiles={ragFiles}
                  loadError={error}
                />
              </TabsContent>
              <TabsContent value="avanzado" forceMount>
                <ChatbotAdvancedSettings
                  chatbotId={chatbotIdForUpdate}
                  chatbotSlug={chatbotSlugForUpdate}
                  token={session.strapiToken}
                  initialAutoAssignement={autoAssignement}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
