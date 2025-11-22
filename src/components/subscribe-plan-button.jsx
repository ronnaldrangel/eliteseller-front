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
        let target = data?.url || data?.redirectUrl || data?.href || null;
        if (!target) {
          toast.message("Error en el sistema. Inténtalo de nuevo más tarde.");
          return;
        }

        if (typeof target === "string" && target.startsWith("vhttp")) {
          target = target.slice(1);
        }

        if (typeof target === "string" && target.length > 0) {
          if (target === "/billing") {
            toast.error(
              "Primero añade un metodo de pago valido"
            );
            router.push("/billing");
            return;
          }
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
        className="w-full mt-auto h-12 text-base cursor-pointer"
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
              Al darle a confirmar, serás redirigido al proceso de pago.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            {/* <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button> */}
            <Button
              type="button"
              className="w-full h-12 cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white"
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
