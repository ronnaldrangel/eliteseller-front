"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { buildStrapiUrl } from "@/lib/strapi";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConnectWhatsAppButton({
  documentId,
  chatbotHasWhatsApp = false,
  chatbotId,
  strapiToken,
  className,
}) {
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(chatbotHasWhatsApp);

  const enableWhatsAppIntegration = async (chatbotId) => {
    const url = buildStrapiUrl(`/api/chatbots/${chatbotId}`);
    try {
      // Actualiza el chatbot para marcar que WhatsApp está conectado
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${strapiToken}`,
        },
        body: JSON.stringify({
          data: {
            isWhatsAppConnected: true,
          },
        }),
      });

      if (!res.ok) {
        const details = await res.json().catch(() => ({}));
        const msg =
          details?.error?.message ||
          `No se pudo actualizar el chatbot inténtalo de nuevo`;
        toast.error(msg);
        return false;
      }

      toast.success("Integración de WhatsApp habilitada");
      setIsConnected(true);
      return true;
    } catch (error) {
      console.error("Error al habilitar la integración de WhatsApp:", error);
      toast.error("Error de red al actualizar el chatbot");
      return false;
    }
  };

  const handleClick = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const res = await fetch(
        "https://n8n.eliteseller.app/webhook/create-whatsapp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId }),
        }
      );
      if (res.status === 200) {
        await enableWhatsAppIntegration(chatbotId);
      } else {
        const body = await res.json().catch(() => ({}));
        const msg =
          body?.error?.message || `No se pudo conectar (status ${res.status})`;
        toast.error(msg);
      }
    } catch (_) {
      toast.error("Error de red al conectar");
    } finally {
      setLoading(false);
    }
  };

  if (isConnected) {
    return (
      <div className={cn("flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg w-full md:w-auto", className)}>
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
        <span className="text-sm font-medium text-green-700">
          WhatsApp ya está conectado
        </span>
      </div>
    );
  }

  return (
    <Button
      type="button"
      className={cn("w-full md:w-auto", className)}
      onClick={handleClick}
      disabled={loading || !documentId || isConnected}
    >
      {loading ? "Conectando…" : "Conectar WhatsApp"}
    </Button>
  );
}
