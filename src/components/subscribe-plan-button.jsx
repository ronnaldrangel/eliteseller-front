"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SubscribePlanButton({ planId, userId, highlight }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (!planId || loading) return;
    if (!userId) {
      toast.error("Inicia sesión para suscribirte");
      router.push("/auth/login?callbackUrl=/plans");
      return;
    }

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
        } catch { }
      } else {
        try {
          text = await res.text();
        } catch { }
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

  return (
    <Button
      type="button"
      size="lg"
      className={`w-full mt-auto h-12 text-base cursor-pointer transition-all duration-300 transform group relative overflow-hidden flex items-center justify-center gap-2 ${highlight
        ? "bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 hover:shadow-primary/40 scale-100 hover:scale-[1.02] active:scale-[0.98]"
        : "hover:scale-[1.02] active:scale-[0.98]"
        }`}
      onClick={handleClick}
      disabled={loading || !planId || !userId}
    >
      <span className="relative z-10 flex items-center gap-2">
        {loading ? "Procesando…" : "Empieza ahora"}
        {!loading && (
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        )}
      </span>

      {/* Shine effect */}
      <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine" />
    </Button>
  );
}
