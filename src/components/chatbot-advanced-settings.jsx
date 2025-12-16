"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buildStrapiUrl } from "@/lib/strapi";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function ChatbotAdvancedSettings({
  chatbotSlug,
  chatbotId,
  token,
  initialAutoAssignement = false,
  initialEnableChatbot = true,
}) {
  const safeInitial =
    typeof initialAutoAssignement === "boolean"
      ? initialAutoAssignement
      : !!initialAutoAssignement;
  const safeInitialEnable =
    typeof initialEnableChatbot === "boolean"
      ? initialEnableChatbot
      : !!initialEnableChatbot;

  const [autoAssignEnabled, setAutoAssignEnabled] = useState(safeInitial);
  const [chatbotEnabled, setChatbotEnabled] = useState(safeInitialEnable);
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

  const toggleChatbotEnabled = async (nextValue = !chatbotEnabled) => {
    await updateBooleanField({
      fieldKeys: "enable_chatbot",
      nextValue,
      onSuccess: setChatbotEnabled,
      successMessage: (value) =>
        value ? "Chatbot activado." : "Chatbot desactivado.",
    });
  };

  const loadingAutoAssign = loadingField === "auto_assignment";

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
            <p className="text-base font-semibold">Activar Agente</p>
            <p className="text-sm text-muted-foreground">
              Activa o desactiva el agente para que responda a los clientes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={chatbotEnabled ? "default" : "secondary"}>
              {chatbotEnabled ? "Activado" : "Desactivado"}
            </Badge>
            <Switch
              id="enable-chatbot-switch"
              checked={chatbotEnabled}
              disabled={loadingField === "enable_chatbot" || !token || !targetId}
              onCheckedChange={(checked) => toggleChatbotEnabled(checked)}
            />
          </div>
        </div>
      </div>
    </div >
  );
}
