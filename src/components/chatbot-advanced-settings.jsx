"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildStrapiUrl } from "@/lib/strapi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function ChatbotAdvancedSettings({
  chatbotSlug,
  chatbotId,
  token,
  initialAutoAssignement = false,
  initialActiveRag = false,
}) {
  const safeInitial =
    typeof initialAutoAssignement === "boolean"
      ? initialAutoAssignement
      : !!initialAutoAssignement;
  const safeActiveRag =
    typeof initialActiveRag === "boolean" ? initialActiveRag : !!initialActiveRag;
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(safeInitial);
  const [activeRagEnabled, setActiveRagEnabled] = useState(safeActiveRag);
  const [loadingField, setLoadingField] = useState(null);

  const targetId = chatbotSlug;

  const updateBooleanField = async ({
    fieldKeys,
    nextValue,
    onSuccess,
    successMessage,
    errorMessage = "No se pudo actualizar la configuracion avanzada",
  }) => {
    const keys = Array.isArray(fieldKeys) ? fieldKeys : [fieldKeys];
    if (!token || !targetId) {
      toast.error("Faltan datos del chatbot para actualizar");
      return;
    }

    setLoadingField(keys[0]);
    try {
      for (let i = 0; i < keys.length; i++) {
        const field = keys[i];
        const res = await fetch(buildStrapiUrl(`/api/chatbots/${targetId}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: { [field]: nextValue },
          }),
        });

        const body = await res.json().catch(() => ({}));

        if (res.ok) {
          onSuccess?.(nextValue);
          toast.success(successMessage(nextValue));
          return;
        }

        const isInvalidKey =
          res.status === 400 &&
          (body?.error?.details?.key === field ||
            body?.error?.name === "ValidationError");

        if (isInvalidKey && i < keys.length - 1) {
          // Intenta con la siguiente variante del nombre del campo
          continue;
        }

        toast.error(body?.error?.message || errorMessage);
        return;
      }
    } catch (error) {
      toast.error("Error de red al actualizar");
    } finally {
      setLoadingField(null);
    }
  };

  const toggleAutoAssign = async (nextValue = !autoAssignEnabled) => {
    await updateBooleanField({
      fieldKeys: "auto_assignment",
      nextValue,
      onSuccess: setAutoAssignEnabled,
      successMessage: (value) =>
        value ? "Auto asignacion activada." : "Auto asignacion desactivada.",
    });
  };

  const toggleActiveRag = async (nextValue = !activeRagEnabled) => {
    await updateBooleanField({
      fieldKeys: ["active_rag", "activeRag"],
      nextValue,
      onSuccess: setActiveRagEnabled,
      successMessage: (value) =>
        value ? "RAG activado para el chatbot." : "RAG desactivado para el chatbot.",
    });
  };

  const loadingAutoAssign = loadingField === "auto_assignment";
  const loadingActiveRag =
    loadingField === "active_rag" || loadingField === "activeRag";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-base font-semibold">Auto asignacion a un Humano</p>
            <p className="text-sm text-muted-foreground">
              Permite que el Eliteseller asigne automaticamente los chats a un humano.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={autoAssignEnabled ? "default" : "secondary"}>
              {autoAssignEnabled ? "Activado" : "Desactivado"}
            </Badge>
            <Switch
              id="auto-assign-switch"
              checked={autoAssignEnabled}
              disabled={loadingAutoAssign || !token || !targetId}
              onCheckedChange={(checked) => toggleAutoAssign(checked)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-base font-semibold">Activar RAG</p>
            <p className="text-sm text-muted-foreground">
              Controla si el chatbot puede usar los archivos de RAG en sus respuestas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={activeRagEnabled ? "default" : "secondary"}>
              {activeRagEnabled ? "Activado" : "Desactivado"}
            </Badge>
            <Switch
              id="active-rag-switch"
              checked={activeRagEnabled}
              disabled={loadingActiveRag || !token || !targetId}
              onCheckedChange={(checked) => toggleActiveRag(checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
