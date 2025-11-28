"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildStrapiUrl } from "@/lib/strapi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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

  const toggleAutoAssign = async () => {
    if (!token || !targetId) {
      toast.error("Faltan datos del chatbot para actualizar");
      return;
    }

    const nextValue = !autoAssignEnabled;
    setLoading(true);
    try {
      const res = await fetch(buildStrapiUrl(`/api/chatbots/${targetId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: { auto_assignement: nextValue },
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
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-base font-semibold">Auto asignacion</p>
          <p className="text-sm text-muted-foreground">
            Cambia el estado del campo auto_assignement del chatbot.
          </p>
        </div>
        <Badge variant={autoAssignEnabled ? "default" : "secondary"}>
          {autoAssignEnabled ? "Activado" : "Desactivado"}
        </Badge>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Este control impacta el comportamiento de asignacion automatica en el
          chatbot.
        </div>
        <Button
          type="button"
          onClick={toggleAutoAssign}
          disabled={loading || !token || !targetId}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Actualizando...
            </>
          ) : autoAssignEnabled ? (
            "Desactivar auto asignacion"
          ) : (
            "Activar auto asignacion"
          )}
        </Button>
      </div>
    </div>
  );
}
