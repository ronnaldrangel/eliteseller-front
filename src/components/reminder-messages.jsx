"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { buildStrapiUrl } from "@/lib/strapi";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
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

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border bg-card p-5 space-y-4 shadow-sm"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Mensajes por temperatura</h2>
        <p className="text-sm text-muted-foreground">
          Define varios mensajes para contactos Hot, Normal y Cold y un único
          intervalo de tiempo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["hot", "normal", "cold"].map((key) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`reminder-${key}`}>
              {key === "hot" ? "Hot" : key === "normal" ? "Normal" : "Cold"}
            </Label>
            <div className="flex flex-wrap gap-2">
              {form[key].map((msg, index) => (
                <span
                  key={`${key}-${index}-${msg}`}
                  className="inline-flex items-center gap-2 rounded-md border border-muted-foreground/20 bg-muted/30 px-3 py-1 text-xs"
                >
                  <span className="truncate max-w-[160px]">{msg}</span>
                  <button
                    type="button"
                    onClick={() => removeMessage(key, index)}
                    className="rounded p-0.5 hover:bg-muted/60"
                    aria-label={`Eliminar mensaje ${msg}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                id={`reminder-${key}`}
                value={inputs[key]}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder={`Nuevo mensaje ${key}`}
                rows={3}
                className="min-h-[96px]"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => addMessage(key)}
              >
                Agregar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reminder-interval">Intervalo (minutos)</Label>
        <Input
          id="reminder-interval"
          type="number"
          min="1"
          value={form.interval}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, interval: e.target.value }))
          }
          placeholder="Ej. 60"
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
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
