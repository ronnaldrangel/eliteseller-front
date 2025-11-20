"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SubscribePlanButton({ planId, userId }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    if (!planId || !userId || loading) return;
    setShowModal(true);
  };

  const handleConfirm = async () => {
    setShowModal(false);
    setLoading(true);
    try {
      const url = `/api/plans/subscribe?plan_id=${encodeURIComponent(
        planId
      )}&userId=${encodeURIComponent(userId)}`;
      const res = await fetch(url, { method: "GET" });
      const contentType = res.headers.get("content-type") || "";

      let data = null;
      let text = null;
      if (contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch {}
      } else {
        try {
          text = await res.text();
        } catch {}
      }

      if (res.ok) {
        let hasValidMethod = data?.statusCode ?? null;
        let target = data?.url || data?.redirectUrl || data?.href || null;
        if (!hasValidMethod || hasValidMethod === 401) {
          toast.error(
            "No se pudo iniciar la suscripción. Redirigiendo a facturación..."
          );
          router.push(target ?? "/billing");
          return;
        }
        if (typeof target === "string" && target.startsWith("vhttp")) {
          target = target.slice(1);
        }
        if (typeof target === "string" && target.length > 0) {
          toast.success("Suscripción iniciada. Redirigiendo...");
          router.push(target);
          return;
        }
        const msg = (data && data.text) || text || "Error en el sistema.";
        if (msg) toast.success(msg);
      }
      // Todo esto se ejecuta cuando n8n responde con un error
      else {
        if (res.status === 403) {
          router.push("/billing");
          return;
        }
        const msg =
          (data && (data.text || data?.error?.message)) ||
          text ||
          `No se pudo iniciar la suscripción, inténtalo de nuevo (status ${res.status})`;
        toast.error(msg);
      }
    } catch (_) {
      toast.error("Error conectando con el servicio");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <>
      <Button
        type="button"
        size="lg"
        className="w-full mt-auto h-12 text-base"
        onClick={handleClick}
        disabled={loading || !planId || !userId}
      >
        {loading ? "Procesando…" : "Empieza ahora"}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar suscripción</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas suscribirte a este plan? Serás
              redirigido al proceso de pago.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              onClick={handleConfirm}
              disabled={loading}
            >
              Confirmar suscripción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
