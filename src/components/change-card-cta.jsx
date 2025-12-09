"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ChangeCardCta({ userId, className = "" }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleClick = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!userId) {
        toast.error("No se pudo actualizar el método", {
          description: "Sesión no disponible: userId faltante.",
        });
        return;
      }

      const res = await fetch(
        "https://n8n.eliteseller.app/webhook/flow/change-card",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );
      let data = null;
      try {
        data = await res.json();
      } catch (_) {
        data = null;
      }
      const url = typeof data?.url === "string" ? data.url : null;

      if (res.ok && url) {
        if (typeof window !== "undefined") {
          window.location.href = url;
          return;
        }
      } else {
        toast.error("No se pudo actualizar el método", {
          description:
            data?.error?.message || "El servicio no devolvió una URL válida.",
        });
      }
    } catch (err) {
      console.warn("Webhook POST failed", err);
      toast.error("Error conectando con el servicio", {
        description: err?.message || "Inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-60 ${className}`}
      disabled={isSubmitting}
    >
      Actualizar método
    </button>
  );
}
