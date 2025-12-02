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
import { Zap } from "lucide-react";

export default function ConfirmRechargeBattery({ planId, userId, endpoint = "/api/tokens/charge" }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    if (!planId || loading) return;
    if (!userId) {
      toast.error("Inicia sesión para recargar la batería");
      router.push("/auth/login");
      return;
    }
    setShowModal(true);
  };

  const handleConfirm = async () => {
    setShowModal(false);
    setLoading(true);
    try {
      const url = `${endpoint}?plan_id=${encodeURIComponent(planId)}&userId=${encodeURIComponent(userId)}`;
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
            toast.error("Verifica tu método de pago e intenta de nuevo.");
            router.push("/billing");
            return;
          }
          toast.success("Recarga iniciada. Redirigiendo...");
          router.push(target);
          return;
        }
        const msg = (data && data.text) || text || "Operación completada";
        if (msg) toast.success(msg);
      } else {
        if (res.status === 403) {
          router.push("/billing");
          return;
        }
        const msg = (data && (data.text || data?.error?.message)) || text || `No se pudo iniciar la recarga (status ${res.status})`;
        toast.error(msg);
      }
    } catch (_) {
      toast.error("Error conectando con el servicio");
    } finally {
      setLoading(false);
    }
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
        <Zap className="h-4 w-4 mr-2" />
        {loading ? "Procesando…" : "Recargar batería"}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar recarga</DialogTitle>
            <DialogDescription>
              Al confirmar, se realizará el cobro a tu tarjeta asociada para la recarga de baterías.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              className="w-full h-12 cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={handleConfirm}
              disabled={loading}
            >
              Confirmar recarga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
