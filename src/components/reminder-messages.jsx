"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { buildStrapiUrl } from "@/lib/strapi";
import { Input } from "@/components/ui/input";
import { BellRing, Clock3, Flame, Loader2, Snowflake, Sparkles, X } from "lucide-react";
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

  const [form, setForm] = useState({
    hot: toArray(initialHot),
    normal: toArray(initialNormal),
    cold: toArray(initialCold),
    interval: initialInterval || "",
  });
  const [inputs, setInputs] = useState({ hot: "", normal: "", cold: "" });
  const [loading, setLoading] = useState(false);

  const targetId = chatbotSlug || chatbotId;

  const addMessage = (key) => {
    const text = inputs[key].trim();
    if (!text) return;
    setForm((prev) => ({ ...prev, [key]: [...prev[key], text] }));
    setInputs((prev) => ({ ...prev, [key]: "" }));
  };

  const removeMessage = (key, index) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !targetId) {
      toast.error("Faltan datos para guardar los mensajes.");
      return;
    }

    if (!form.interval) {
      toast.error("Define el intervalo de tiempo.");
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
          data: {
            reminder_hot_messages: form.hot,
            reminder_normal_messages: form.normal,
            reminder_cold_messages: form.cold,
            reminder_interval_minutes: form.interval,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          body?.error?.message || "No se pudieron guardar los recordatorios.";
        toast.error(msg);
        return;
      }

      toast.success("Mensajes de recordatorio guardados.");
    } catch (err) {
      console.error("Error saving reminder messages", err);
      toast.error("Error de red al guardar.");
    } finally {
      setLoading(false);
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
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border bg-card/95 p-5 shadow-sm md:p-6"
    >
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
                  {form.interval ? `${form.interval} min` : "sin definir"}
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
        {messageTypes.map(({ key, label, description, icon: Icon, badgeClass, areaClass }) => (
          <div
            key={key}
            className={`flex flex-col gap-3 rounded-xl border p-4 ${areaClass}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeClass}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              {form[key].length > 0 && (
                <span className="text-xs font-medium text-muted-foreground">
                  {form[key].length} msg
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {form[key].map((msg, index) => (
                <span
                  key={`${key}-${index}-${msg}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/70 px-3 py-1 text-xs shadow-sm"
                >
                  <span className="truncate max-w-[180px] text-foreground">{msg}</span>
                  <button
                    type="button"
                    onClick={() => removeMessage(key, index)}
                    className="rounded-full border border-transparent p-1 text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Eliminar mensaje ${msg}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <Textarea
                id={`reminder-${key}`}
                value={inputs[key]}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder={`Nuevo mensaje ${label}`}
                rows={3}
                className="min-h-[96px] flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                className="sm:w-28"
                onClick={() => addMessage(key)}
              >
                Agregar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="reminder-interval" className="text-sm font-semibold">
            Intervalo de envío (minutos)
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Input
              id="reminder-interval"
              type="number"
              min="1"
              value={form.interval}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, interval: e.target.value }))
              }
              placeholder="Ej. 60"
              className="w-full sm:w-40"
            />
            <p className="text-xs text-muted-foreground">
              Un único intervalo aplica para todas las temperaturas.
            </p>
          </div>
        </div>

        <Button
          type="submit"
          className="self-stretch md:self-auto"
          disabled={loading || !token || !targetId || !form.interval}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar mensajes"
          )}
        </Button>
      </div>
    </form>
  );
}
