import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils";
import { buildStrapiUrl } from "@/lib/strapi";

export default async function BatteryPage({ params }) {
    const session = await auth();
    const p = await params;
    const chatbotSlug = String(p?.chatbot || "");

    if (!session) {
        redirect(
            `/auth/login?callbackUrl=${encodeURIComponent(
                `/dashboard/${chatbotSlug}/battery`
            )}`
        );
    }

    const chatbot = await getChatbotBySlug(
        chatbotSlug,
        session.strapiToken,
        session.user.strapiUserId
    );
    if (!chatbot) redirect("/select");

    const documentId = chatbot.documentId;

    let chatbots = [];
    let error = null;
    let rawPayload = null;

    try {
        const url = buildStrapiUrl(
            `/api/chatbots/${encodeURIComponent(chatbot.slug)}`
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

    // Derivar datos del primer chatbot (soporta data en attributes o plano)
    const firstEntity =
        Array.isArray(chatbots) && chatbots.length > 0 ? chatbots[0] : null;
    const attrs = firstEntity?.attributes || firstEntity || {};

    return (
        <div className="flex flex-1 flex-col px-4 lg:px-6">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="py-4 md:py-6">
                    <h1 className="text-2xl font-semibold">Batería</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Gestiona y monitorea el estado de tu batería de mensajes.
                    </p>
                </div>

                <div className="pb-6">
                    <div>

                        {/* Placeholder content - you can customize this later */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-lg border bg-muted/20 p-4">
                                <div className="text-sm font-medium text-muted-foreground">
                                    Mensajes Disponibles
                                </div>
                                <div className="text-2xl font-bold mt-2">1,000</div>
                            </div>
                            <div className="rounded-lg border bg-muted/20 p-4">
                                <div className="text-sm font-medium text-muted-foreground">
                                    Mensajes Usados
                                </div>
                                <div className="text-2xl font-bold mt-2">250</div>
                            </div>
                            <div className="rounded-lg border bg-muted/20 p-4">
                                <div className="text-sm font-medium text-muted-foreground">
                                    Mensajes Restantes
                                </div>
                                <div className="text-2xl font-bold mt-2">750</div>
                            </div>
                        </div>

                        {/* Debug: Raw Payload Display */}
                        <div className="mt-6 space-y-4">
                            <h2 className="text-lg font-semibold">Raw Payload (Debug)</h2>
                            <div className="rounded-lg border bg-muted/10 p-4 overflow-auto max-h-[600px]">
                                <pre className="text-xs">
                                    {JSON.stringify(rawPayload, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
