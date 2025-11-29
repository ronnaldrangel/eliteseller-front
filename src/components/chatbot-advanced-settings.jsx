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
}) {
  const safeInitial =
    typeof initialAutoAssignement === "boolean"
      ? initialAutoAssignement
      : !!initialAutoAssignement;
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(safeInitial);
  const [loading, setLoading] = useState(false);

  const targetId = chatbotSlug || chatbotId;

  const toggleAutoAssign = async (nextValue = !autoAssignEnabled) => {
    if (!token || !targetId) {
      toast.error("Faltan datos del chatbot para actualizar");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(buildStrapiUrl(`/api/chatbots/${targetId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: { auto_assignment: nextValue },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          body?.error?.message ||
          "No se pudo actualizar la configuracion avanzada";
        toast.error(msg);
        return;
      }

      setAutoAssignEnabled(nextValue);
      toast.success(
        nextValue
          ? "Auto asignacion activada."
          : "Auto asignacion desactivada."
      );
    } catch (error) {
      console.error("Error al actualizar auto_assignement", error);
      toast.error("Error de red al actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
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
            disabled={loading || !token || !targetId}
            onCheckedChange={(checked) => toggleAutoAssign(checked)}
          />
        </div>
      </div>
    </div>
  );
}
