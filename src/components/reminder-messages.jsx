"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
  const [intervalUnit, setIntervalUnit] = useState(() => {
    const m = Number(initialInterval) || 0;
    return m > 0 && m % 60 === 0 ? "hours" : "minutes";
  });
  const [interval, setInterval] = useState(() => {
    const m = Number(initialInterval) || 0;
    return m > 0 && m % 60 === 0 ? String(Math.floor(m / 60)) : String(initialInterval || "");
  });
  const [loadingKey, setLoadingKey] = useState(null);

  // Prefer the numeric/document ID for Strapi writes; fall back to slug only if needed.
  const targetId = chatbotSlug;

  const findExistingRemarketing = async (key) => {
    try {
      const qs = new URLSearchParams();
      qs.set("filters[chatbot][documentId][$eq]", chatbotId);
      qs.set("filters[hotness_message][$eq]", key);
      qs.set("pagination[pageSize]", "1");
      const res = await fetch(buildStrapiUrl(`/api/remarketings?${qs.toString()}`), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => ({}));
      const item = Array.isArray(data?.data) ? data.data[0] : data?.[0];
      if (!item) return null;
      const attrs = item?.attributes || {};
      return { id: item?.id, documentId: item?.documentId };
    } catch {
      return null;
    }
  };

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
      if (!chatbotId) {
        toast.error("Falta el ID del chatbot para guardar remarketing.");
        return;
      }
    }

    setLoadingKey(key);
    try {
      if (key === "interval") {
        const valueNum = Number(interval) || 0;
        if (!valueNum || valueNum <= 0) {
          toast.error("El intervalo debe ser mayor a 0.");
          return;
        }
        const minutesToSave = intervalUnit === "hours" ? valueNum * 60 : valueNum;
        if (minutesToSave > 1440) {
          toast.error("El intervalo máximo es 24 horas (1440 minutos).");
          return;
        }
        const res = await fetch(buildStrapiUrl(`/api/chatbots/${targetId}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: { cooldown_minutes: minutesToSave },
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
        const existing = await findExistingRemarketing(key);
        if (existing?.documentId || existing?.id) {
          const doc = existing.documentId || existing.id;
          const updateRes = await fetch(buildStrapiUrl(`/api/remarketings/${encodeURIComponent(doc)}`), {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              data: {
                content: messages[key],
                hotness_message: key,
              },
            }),
          });
          if (!updateRes.ok) {
            const updateBody = await updateRes.json().catch(() => ({}));
            const updateMsg = updateBody?.error?.message || "No se pudo actualizar el mensaje.";
            toast.error(updateMsg);
            return;
          }
        } else {
          const createRes = await fetch(buildStrapiUrl("/api/remarketings"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              data: {
                content: messages[key],
                hotness_message: key,
                chatbot: chatbotId,
              },
            }),
          });
          if (!createRes.ok) {
            const createBody = await createRes.json().catch(() => ({}));
            const createMsg = createBody?.error?.message || "No se pudo crear el mensaje.";
            toast.error(createMsg);
            return;
          }
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
      description: "Mensajes para mantener la conversación.",
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
    <div >
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
                <Textarea
                  id={`reminder-${key}`}
                  value={messages[key]}
                  onChange={(e) =>
                    setMessages((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder={`Escribe el mensaje ${label}`}
                  rows={3}
                  maxLength={255}
                />
                <Button
                  type="button"
                  variant={messages[key]?.trim() ? "default" : "secondary"}
                  disabled={isLoading || !messages[key]?.trim()}
                  onClick={() => handleSave(key)}
                  className="transition-colors cursor-pointer"
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
            Intervalo de envío (minutos u horas)
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
              max={intervalUnit === "hours" ? 24 : 1440}
            />
            <Select value={intervalUnit} onValueChange={(v) => setIntervalUnit(v)}>
              <SelectTrigger id="reminder-interval-unit" className="w-full sm:w-32">
                <SelectValue placeholder="Unidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutos</SelectItem>
                <SelectItem value="hours">Horas</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Un único intervalo aplica para todas las temperaturas. Máximo 24 horas (1440 min).
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant={interval?.trim() ? "default" : "secondary"}
          className="self-stretch md:self-auto"
          disabled={loadingKey === "interval" || !interval?.trim()}
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
