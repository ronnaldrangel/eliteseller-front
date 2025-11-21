import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils";
import { redirect } from "next/navigation";
import ConnectWhatsAppButton from "@/components/connect-whatsapp-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default async function WhatsAppIntegrationPage({ params }) {
  const session = await auth();
  const p = await params;
  const chatbotSlug = String(p?.chatbot || "");

  if (!session) {
    redirect(
      `/auth/login?callbackUrl=/dashboard/${chatbotSlug}/integrations/whatsapp`
    );
  }

  const chatbot = await getChatbotBySlug(
    chatbotSlug,
    session.strapiToken,
    session.user.strapiUserId
  );

  if (!chatbot) {
    redirect("/select");
  }

  const chatbotHasWhatsApp = chatbot?.isWhatsAppConnected || false;

  const qs = new URLSearchParams();
  qs.set("filters[chatbot][documentId][$eq]", chatbot.documentId);
  const url = buildStrapiUrl(`/api/accounts?${qs.toString()}`);

  let payload = null;
  let error = null;

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
      error =
        details?.error?.message ||
        `No se pudieron cargar las cuentas (status ${res.status})`;
    } else {
      const data = await res.json();
      payload = data;
    }
  } catch (_) {
    error = "Error al conectar con Strapi. Verifica tu conexión.";
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-8">
      <Card className="bg-muted/20">
        <CardContent className="py-6">
          <div className="grid gap-6 md:grid-cols-[1fr_280px] items-center">
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">
                Conecta tu WhatsApp Business by Wazend
              </h1>
              <p className="text-sm text-foreground/80">
                Es el primer paso para empezar a vender con Eliteseller.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                {(() => {
                  const items = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.data)
                    ? payload.data
                    : [];
                  const first = items[0] || null;
                  const attrs = first?.attributes || first || {};
                  const accountDocumentId =
                    attrs?.documentId || first?.documentId || null;
                  return (
                    <ConnectWhatsAppButton
                      documentId={accountDocumentId}
                      chatbotHasWhatsApp={chatbotHasWhatsApp}
                      chatbotId={chatbot.slug}
                      strapiToken={session.strapiToken}
                    />
                  );
                })()}
                <Button variant="outline">Contactar soporte</Button>
              </div>
              <span className="text-xs text-foreground/80">
                Solo podrás realizar la conexión una vez por chatbot.
              </span>
            </div>
            <div className="block">
              <img
                src="/images/wazend/bot-friends.png"
                alt="WhatsApp Business API"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* <Card className="bg-muted/20">
        <CardContent className="py-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pasos para conectar</h2>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="bg-background p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground/10 text-sm font-semibold">1</span>
                <div className="space-y-1">
                  <div className="text-sm font-semibold">Dale click a Conectar WhatsApp: Conéctate con tu cuenta de Facebook Business.</div>
                  <div className="text-sm text-muted-foreground">Inicia sesión en Meta: Conéctate con tu cuenta de Facebook Business.</div>
                </div>
              </div>
            </div>
            <div className="bg-background p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground/10 text-sm font-semibold">2</span>
                <div className="space-y-1">
                  <div className="text-sm font-semibold">Completa la información: Nombre, sitio web y categoría del negocio.</div>
                  <div className="text-sm text-muted-foreground">Completa la información: Nombre, sitio web y categoría del negocio.</div>
                </div>
              </div>
            </div>
            <div className="bg-background p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground/10 text-sm font-semibold">3</span>
                <div className="space-y-1">
                  <div className="text-sm font-semibold">Activa tu número de WhatsApp: Selecciona 'Usar solo un nombre visible' y confirma.</div>
                  <div className="text-sm text-muted-foreground">Activa tu número de WhatsApp: Selecciona 'Usar solo un nombre visible' y confirma.</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dudas frecuentes</h3>
      </div>

      <Accordion
        type="single"
        collapsible
        className="rounded-xl border bg-muted/10"
      >
        <AccordionItem value="q1" className="px-4">
          <AccordionTrigger className="gap-2">
            ¿Necesito tener una cuenta en Meta Business?
          </AccordionTrigger>
          <AccordionContent>
            No, es necesario ya que gracias a Wazend API, puedes vincular tu
            WhatsApp solo escaneando el QR
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="q3" className="px-4">
          <AccordionTrigger className="gap-2">
            ¿Qué pasa si no conecto mi WhatsApp?
          </AccordionTrigger>
          <AccordionContent>
            No podrás enviar ni recibir mensajes desde tu vendedor inteligente
            vía WhatsApp.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="q5" className="px-4">
          <AccordionTrigger className="gap-2">
            ¿Cuánto cuesta usar la API de WhatsApp Business?
          </AccordionTrigger>
          <AccordionContent>
            No, tiene costo alguno, solo conecta, y ya puedes empezar a vender.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
