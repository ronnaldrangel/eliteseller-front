"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildStrapiUrl } from "@/lib/strapi";
import { BellRing, Clock3, Flame, Loader2, Snowflake, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function ReminderMessages({
  token,
  chatbotSlug,
  chatbotId,
  initialHot = [],
  initialNormal = [],
  initialCold = [],
  initialInterval = "",
}) {
  const toArray = (val) => {
    if (Array.isArray(val)) return val.filter(Boolean).map((v) => String(v));
    if (typeof val === "string" && val.trim()) return [val];
    return [];
  };

  const [messages, setMessages] = useState({
    hot: toArray(initialHot)[0] || "",
    normal: toArray(initialNormal)[0] || "",
    cold: toArray(initialCold)[0] || "",
  });
  const [interval, setInterval] = useState(initialInterval || "");
  const [loadingKey, setLoadingKey] = useState(null);

  const targetId = chatbotSlug || chatbotId;

  const handleSave = async (key) => {
    if (!token || !targetId) {
      toast.error("Faltan datos para guardar los mensajes.");
      return;
    }

    if (key === "interval" && !interval) {
      toast.error("Define el intervalo de tiempo.");
      return;
    }

    if (key !== "interval") {
      if (!messages[key]?.trim()) {
        toast.error("Escribe un mensaje antes de guardar.");
        return;
      }
      if (!chatbotId && !targetId) {
        toast.error("Falta el identificador del chatbot para remarketing.");
        return;
      }
    }

    setLoadingKey(key);
    try {
      if (key === "interval") {
        const res = await fetch(buildStrapiUrl(`/api/chatbots/${targetId}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: { cooldown_minutes: interval },
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const msg =
            body?.error?.message || "No se pudo guardar el intervalo.";
          toast.error(msg);
          return;
        }
      } else {
        const remarketingRes = await fetch(
          buildStrapiUrl("/api/remarketings"),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              data: {
                content: messages[key],
                hotness_message: key,
                chatbot: chatbotId || targetId,
              },
            }),
          }
        );

        if (!remarketingRes.ok) {
          const remarketingBody = await remarketingRes.json().catch(() => ({}));
          const remarketingMsg =
            remarketingBody?.error?.message ||
            "No se pudo guardar el mensaje de remarketing.";
          toast.error(remarketingMsg);
          return;
        }
      }

      const label =
        key === "hot"
          ? "Hot"
          : key === "normal"
          ? "Normal"
          : key === "cold"
          ? "Cold"
          : "intervalo";
      toast.success(`Guardado ${label}.`);
    } catch (err) {
      console.error("Error saving reminder messages", err);
      toast.error("Error de red al guardar.");
    } finally {
      setLoadingKey(null);
    }
  };

  const messageTypes = [
    {
      key: "hot",
      label: "Hot",
      description: "Seguimiento inmediato para contactos con alta intención.",
      icon: Flame,
      badgeClass: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100",
      areaClass: "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900",
    },
    {
      key: "normal",
      label: "Normal",
      description: "Mensajes de nurturing para mantener la conversación.",
      icon: Sparkles,
      badgeClass: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100",
      areaClass: "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900",
    },
    {
      key: "cold",
      label: "Cold",
      description: "Reengancha contactos fríos con valor y recordatorios suaves.",
      icon: Snowflake,
      badgeClass: "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-100",
      areaClass: "bg-sky-50/70 dark:bg-sky-950/30 border-sky-200/60 dark:border-sky-900",
    },
  ];

  return (
    <div className="rounded-2xl border bg-card/95 p-5 shadow-sm md:p-6">
      <div className="rounded-xl border border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-primary/15 p-3 text-primary ring-1 ring-primary/20">
            <BellRing className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold">Mensajes de recordatorio</h2>
              <span className="inline-flex items-center gap-2 rounded-full bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-primary/10">
                <Clock3 className="h-4 w-4 text-primary" />
                Intervalo actual:{" "}
                <strong className="text-foreground">
                  {interval ? `${interval} min` : "sin definir"}
                </strong>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Define varios mensajes para cada temperatura y un único intervalo de envío para todos.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {messageTypes.map(({ key, label, description, icon: Icon, badgeClass, areaClass }) => {
          const isLoading = loadingKey === key;
          return (
            <div
              key={key}
              className={`flex flex-col gap-3 rounded-xl border p-4 ${areaClass}`}
            >
              <div className="space-y-2">
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeClass}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor={`reminder-${key}`} className="text-sm font-medium">
                  Mensaje {label}
                </Label>
                <Input
                  id={`reminder-${key}`}
                  value={messages[key]}
                  onChange={(e) =>
                    setMessages((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder={`Escribe el mensaje ${label}`}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isLoading}
                  onClick={() => handleSave(key)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-xl border bg-muted/40 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="reminder-interval" className="text-sm font-semibold">
            Intervalo de envío (minutos)
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Input
              id="reminder-interval"
              type="number"
              min="1"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              placeholder="Ej. 60"
              className="w-full sm:w-40"
            />
            <p className="text-xs text-muted-foreground">
              Un único intervalo aplica para todas las temperaturas.
            </p>
          </div>
        </div>

        <Button
          type="button"
          className="self-stretch md:self-auto"
          disabled={loadingKey === "interval" || !interval}
          onClick={() => handleSave("interval")}
        >
          {loadingKey === "interval" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar intervalo"
          )}
        </Button>
      </div>
    </div>
  );
}
