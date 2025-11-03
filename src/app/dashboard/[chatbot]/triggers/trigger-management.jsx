"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { buildStrapiUrl } from "@/lib/strapi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const MAX_KEYWORDS_LENGTH = 360;
const MAX_MESSAGE_LENGTH = 500;

const randomId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const normalizeTrigger = (entry) => {
  if (!entry) return null;

  // Extraer los mensajes de la relación trigger_contents
  const triggerContents = entry.trigger_contents || [];
  const messages = triggerContents.map((tc) => ({
    id: tc.id || tc.documentId,
    message: tc.message || "",
  }));

  return {
    id: String(entry.documentId ?? entry.id ?? randomId()),
    documentId: entry.documentId ? String(entry.documentId) : null,
    name: entry.name ?? "",
    keywords: entry.keywords ?? "",
    keywords_ai: entry.keywords_ai ?? "",
    available: entry.available ?? false,
    id_ads: entry.id_ads ?? null,
    messages: messages, // 👈 Array de mensajes de la relación
  };
};

export default function TriggerManagement({
  initialTriggers = [],
  token,
  chatbotId,
}) {
  const [triggers, setTriggers] = useState(
    Array.isArray(initialTriggers)
      ? initialTriggers.map(normalizeTrigger).filter(Boolean)
      : []
  );
  const [form, setForm] = useState({
    name: "",
    keywords: "",
    keywords_ai: "",
    message: "", // 👈 Cambio de 'content' a 'message'
    available: true,
    id_ads: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ loading: false, error: null });

  useEffect(() => {
    if (!Array.isArray(initialTriggers)) return;
    setTriggers(initialTriggers.map(normalizeTrigger).filter(Boolean));
  }, [initialTriggers]);

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Asigna un nombre para identificar el disparador.";
    }

    if (!form.keywords.trim()) {
      nextErrors.keywords =
        "Define las palabras clave que activan este disparador.";
    } else if (form.keywords.length > MAX_KEYWORDS_LENGTH) {
      nextErrors.keywords = `Maximo ${MAX_KEYWORDS_LENGTH} caracteres permitidos.`;
    }

    if (!form.message.trim()) {
      nextErrors.message =
        "Especifica el mensaje de respuesta que se ejecutara.";
    } else if (form.message.length > MAX_MESSAGE_LENGTH) {
      nextErrors.message = `Maximo ${MAX_MESSAGE_LENGTH} caracteres permitidos.`;
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      setStatus({
        loading: false,
        error: "Corregi los campos marcados para guardar el disparador.",
      });
      return;
    }

    setErrors({});
    setStatus({ loading: true, error: null });

    try {
      // Paso 1: Crear el trigger
      const triggerPayload = {
        data: {
          name: form.name.trim(),
          keywords: form.keywords.trim(),
          keywords_ai: form.keywords_ai.trim() || form.keywords.trim(),
          available: Boolean(form.available),
          id_ads: form.id_ads.trim() || null,
        },
      };

      if (chatbotId) {
        triggerPayload.data.chatbot = { connect: [{ documentId: chatbotId }] };
      }

      const triggerResponse = await fetch(buildStrapiUrl(`/api/triggers`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(triggerPayload),
      });

      const triggerBody = await triggerResponse.json().catch(() => ({}));
      if (!triggerResponse.ok) {
        const message =
          triggerBody?.error?.message ||
          "No se pudo crear el disparador. Intenta nuevamente.";
        setStatus({ loading: false, error: message });
        return;
      }

      const createdTrigger = triggerBody?.data ?? triggerBody;
      const triggerDocId = createdTrigger.documentId || createdTrigger.id;

      // Paso 2: Crear el trigger_content relacionado
      const contentPayload = {
        data: {
          message: form.message.trim(),
          trigger: { connect: [{ documentId: triggerDocId }] },
        },
      };

      const contentResponse = await fetch(
        buildStrapiUrl(`/api/trigger-contents`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(contentPayload),
        }
      );

      const contentBody = await contentResponse.json().catch(() => ({}));
      if (!contentResponse.ok) {
        console.error("Error creando trigger_content:", contentBody);
        // No bloqueamos el flujo, pero mostramos advertencia
        toast.warning(
          "Disparador creado pero hubo un error al guardar el mensaje."
        );
      }

      // Normalizar con el mensaje incluido
      const normalized = normalizeTrigger({
        ...createdTrigger,
        trigger_contents: contentResponse.ok
          ? [contentBody?.data ?? contentBody]
          : [],
      });

      if (normalized) {
        setTriggers((previous) => [normalized, ...previous]);
      }

      toast.success("Disparador creado correctamente.");
      setForm({
        name: "",
        keywords: "",
        keywords_ai: "",
        message: "",
        available: true,
        id_ads: "",
      });
      setStatus({ loading: false, error: null });
    } catch (error) {
      console.error("Error en submit:", error);
      setStatus({
        loading: false,
        error: "Error de red al crear el disparador.",
      });
    }
  };

  return (
    <div className="grid gap-6 pb-6">
      <Card className="border-dashed border-muted-foreground/20 bg-muted/10">
        <CardHeader className="gap-1">
          <CardTitle className="text-xl">Nuevo disparador</CardTitle>
          <CardDescription>
            Automatiza respuestas con disparadores basados en palabras clave
            especificas.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="contents">
          <CardContent className="space-y-6">
            <FieldSet className="gap-6">
              <FieldGroup className="gap-6">
                <Field data-invalid={errors.name ? true : undefined}>
                  <FieldLabel htmlFor="trigger-name">Nombre</FieldLabel>
                  <FieldContent>
                    <Input
                      id="trigger-name"
                      placeholder="Ej. Bienvenida inicial"
                      value={form.name}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          name: event.target.value,
                        }))
                      }
                    />
                    <FieldDescription>
                      Sera visible dentro del panel para identificar el
                      disparador.
                    </FieldDescription>
                    <FieldError>{errors.name}</FieldError>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="trigger-id-ads">
                    ID Ads (opcional)
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="trigger-id-ads"
                      placeholder="ID de anuncio o campaña"
                      value={form.id_ads}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          id_ads: event.target.value,
                        }))
                      }
                    />
                    <FieldDescription>
                      Vincula este disparador con un anuncio o campaña
                      especifica.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldGroup>

              <FieldSeparator />

              <FieldGroup className="gap-6">
                <Field data-invalid={errors.keywords ? true : undefined}>
                  <FieldLabel htmlFor="trigger-keywords">
                    Palabras clave
                  </FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="trigger-keywords"
                      rows={3}
                      maxLength={MAX_KEYWORDS_LENGTH}
                      placeholder="Ej. hola, bienvenido, info, ayuda"
                      value={form.keywords}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          keywords: event.target.value,
                        }))
                      }
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <FieldDescription className="text-xs">
                        Palabras o frases que activan este disparador.
                      </FieldDescription>
                      <span>
                        {form.keywords.length}/{MAX_KEYWORDS_LENGTH}
                      </span>
                    </div>
                    <FieldError>{errors.keywords}</FieldError>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="trigger-keywords-ai">
                    Palabras clave IA (opcional)
                  </FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="trigger-keywords-ai"
                      rows={2}
                      maxLength={MAX_KEYWORDS_LENGTH}
                      placeholder="Palabras clave alternativas para IA"
                      value={form.keywords_ai}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          keywords_ai: event.target.value,
                        }))
                      }
                    />
                    <FieldDescription className="text-xs">
                      Si esta vacio, se usaran las palabras clave principales.
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field data-invalid={errors.message ? true : undefined}>
                  <FieldLabel htmlFor="trigger-message">
                    Mensaje de respuesta
                  </FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="trigger-message"
                      rows={4}
                      maxLength={MAX_MESSAGE_LENGTH}
                      placeholder="Define el mensaje que se enviara cuando se active el disparador."
                      value={form.message}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          message: event.target.value,
                        }))
                      }
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <FieldDescription className="text-xs">
                        El mensaje que se enviara cuando se detecten las
                        palabras clave.
                      </FieldDescription>
                      <span>
                        {form.message.length}/{MAX_MESSAGE_LENGTH}
                      </span>
                    </div>
                    <FieldError>{errors.message}</FieldError>
                  </FieldContent>
                </Field>
              </FieldGroup>

              <FieldSeparator />

              <Field orientation="responsive">
                <FieldLabel htmlFor="trigger-available">Estado</FieldLabel>
                <FieldContent>
                  <div className="flex flex-col gap-3 rounded-lg border border-muted-foreground/20 bg-background px-4 py-3 md:flex-row md:items-center md:gap-4">
                    <Switch
                      id="trigger-available"
                      checked={!!form.available}
                      onCheckedChange={(value) =>
                        setForm((previous) => ({
                          ...previous,
                          available: !!value,
                        }))
                      }
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {form.available
                          ? "Disparador disponible"
                          : "Disparador desactivado"}
                      </p>
                      <FieldDescription className="text-xs md:text-sm">
                        Desactivalo temporalmente cuando quieras pausar la
                        automatizacion.
                      </FieldDescription>
                    </div>
                  </div>
                </FieldContent>
              </Field>
            </FieldSet>

            {status.error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {status.error}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t border-dashed border-muted-foreground/20 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-muted-foreground md:text-sm">
              Cuando se detecten las palabras clave, se ejecutara la respuesta
              configurada.
            </div>
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={status.loading || !token || !chatbotId}
            >
              {status.loading ? "Guardando..." : "Crear disparador"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="bg-background/80">
        <CardHeader className="gap-1">
          <CardTitle className="text-lg">Disparadores configurados</CardTitle>
          <CardDescription>
            Visualiza tus automatizaciones activas y revisa rapidamente sus
            palabras clave.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {triggers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
              Aun no has configurado disparadores. Crea el primero para
              automatizar tus flujos.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {triggers.map((trigger) => {
                return (
                  <div
                    key={trigger.id}
                    className="flex h-full flex-col gap-3 rounded-lg border border-muted-foreground/20 bg-muted/10 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          {trigger.name || "Sin nombre"}
                        </span>
                        {trigger.id_ads && (
                          <span className="text-xs text-muted-foreground">
                            ID: {trigger.id_ads}
                          </span>
                        )}
                      </div>
                      <Badge
                        variant={trigger.available ? "default" : "outline"}
                        className="uppercase"
                      >
                        {trigger.available ? "Activo" : "Pausado"}
                      </Badge>
                    </div>
                    <div className="rounded-md border border-muted-foreground/10 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Palabras clave:
                      </span>{" "}
                      {trigger.keywords || "Sin palabras clave."}
                    </div>
                    {trigger.keywords_ai &&
                      trigger.keywords_ai !== trigger.keywords && (
                        <div className="rounded-md border border-blue-500/10 bg-blue-500/5 px-3 py-2 text-xs text-blue-600 dark:text-blue-400">
                          <span className="font-medium">Keywords IA:</span>{" "}
                          {trigger.keywords_ai}
                        </div>
                      )}

                    {/* 👇 Mostrar mensajes de la relación */}
                    <div className="space-y-2">
                      {trigger.messages && trigger.messages.length > 0 ? (
                        trigger.messages.map((msg, idx) => (
                          <div
                            key={msg.id || idx}
                            className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2 text-xs text-primary-foreground/80 dark:text-primary-foreground/60"
                          >
                            <span className="font-medium text-foreground">
                              Mensaje{" "}
                              {trigger.messages.length > 1
                                ? `${idx + 1}:`
                                : ":"}
                            </span>{" "}
                            <span className="text-foreground">
                              {msg.message || "Sin mensaje configurado."}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-md border border-muted-foreground/10 bg-muted/5 px-3 py-2 text-xs text-muted-foreground">
                          Sin mensajes configurados.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
