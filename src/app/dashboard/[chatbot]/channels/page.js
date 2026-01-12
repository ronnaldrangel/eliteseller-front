import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export default async function ChannelsPage({ params }) {
  const session = await auth();
  const p = await params;
  const chatbotSlug = String(p?.chatbot || "");

  if (!session) {
    redirect(`/auth/login?callbackUrl=/dashboard/${chatbotSlug}/channels`);
  }

  const chatbot = await getChatbotBySlug(
    chatbotSlug,
    session.strapiToken,
    session.user.strapiUserId
  );

  if (!chatbot) {
    redirect("/select");
  }

  // Fetch accounts for WhatsApp button
  const qs = new URLSearchParams();
  qs.set("filters[chatbot][documentId][$eq]", chatbot.documentId);
  const url = buildStrapiUrl(`/api/accounts?${qs.toString()}`);

  let accountsPayload = null;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.strapiToken}`,
      },
      cache: "no-store",
    });
    if (res.ok) {
      accountsPayload = await res.json();
    }
  } catch (e) {
    console.error("Error fetching accounts:", e);
  }

  const items = Array.isArray(accountsPayload)
    ? accountsPayload
    : Array.isArray(accountsPayload?.data)
      ? accountsPayload.data
      : [];
  const firstAccount = items[0] || null;
  const accountAttrs = firstAccount?.attributes || firstAccount || {};
  const accountDocumentId = accountAttrs?.documentId || firstAccount?.documentId || null;

  const integrations = [
    {
      id: "whatsapp",
      title: "WhatsApp Business",
      description: "Es el primer paso para empezar a vender con Eliteseller.",
      image: "/images/wazend/bot-friends.png",
      integrationUrl: `/dashboard/${chatbotSlug}/integrations/whatsapp`,
    },
    {
      id: "messenger",
      title: "Messenger",
      description: "Próximamente",
      image: "/images/bot.webp",
      isComingSoon: true,
    },
    {
      id: "instagram",
      title: "Instagram",
      description: "Próximamente",
      image: "/images/bot.webp",
      isComingSoon: true,
    },
    {
      id: "tiktok",
      title: "TikTok",
      description: "Próximamente",
      image: "/images/bot.webp",
      isComingSoon: true,
    },
  ];

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Canales</h1>
            <p className="text-sm text-muted-foreground">
              Conecta tus canales de comunicación favoritos.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
          {integrations.map((item) => (
            <Card
              key={item.id}
              className="group relative overflow-hidden transition hover:shadow-lg hover:-translate-y-1 h-full flex flex-col"
            >
              <CardContent className="space-y-2 text-left flex flex-1 flex-col pt-6">
                {item.image ? (
                  <div className="w-[100px] h-auto mx-auto mb-4">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={100}
                      height={100}
                      className="h-full w-full object-cover"
                      priority={false}
                    />
                  </div>
                ) : null}

                <CardTitle className="text-lg font-semibold text-center">{item.title}</CardTitle>

                <CardDescription className="text-center mb-6 flex-1">
                  {item.description}
                </CardDescription>

                <div className="mt-auto w-full flex justify-center">
                  {item.integrationUrl ? (
                    <Button asChild className="w-full hover:cursor-pointer">
                      <Link href={item.integrationUrl}>Conectar</Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      Próximamente
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
