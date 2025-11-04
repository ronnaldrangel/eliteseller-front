"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";

const MAX_KEYWORDS_LENGTH = 360;
const MAX_MESSAGE_LENGTH = 500;

export default function NewTriggerForm({ token, chatbotId, chatbotSlug, initialTrigger = null, mode = "create" }) {
  const router = useRouter();
  const initialMessage =
    initialTrigger?.trigger_contents?.[0]?.message ??
    initialTrigger?.messages?.[0]?.message ??
    "";
  const initialKeywordsString = (initialTrigger?.keywords ?? "").trim();
  const initialKeywordsList = useMemo(
    () => initialKeywordsString.split(/[\,\s]+/).filter(Boolean),
    [initialKeywordsString]
  );
  const [form, setForm] = useState({
    name: initialTrigger?.name ?? "",
    keywords: initialKeywordsString,
    keywords_ai: initialTrigger?.keywords_ai ?? "",
    message: initialMessage ?? "",
    available: initialTrigger?.available ?? true,
    id_ads: initialTrigger?.id_ads ?? "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ loading: false, error: null });
  const [keywordsList, setKeywordsList] = useState(initialKeywordsList);
  const [keywordInput, setKeywordInput] = useState("");

  const keywordsJoined = useMemo(() => keywordsList.join(","), [keywordsList]);

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Asigna un nombre para identificar el disparador.";
    }

    if (keywordsList.length === 0) {
      nextErrors.keywords =
        "Define las palabras clave que activan este disparador.";
    } else if (keywordsJoined.length > MAX_KEYWORDS_LENGTH) {
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
      const joined = keywordsJoined;
      const joinedAi = form.keywords_ai.trim() || joined;
      if (mode === "edit" && initialTrigger) {
        // Actualizar el trigger existente
        const triggerDocId = initialTrigger.documentId || initialTrigger.id;
        const triggerPayload = {
          data: {
            name: form.name.trim(),
            keywords: joined,
            keywords_ai: joinedAi,
            available: Boolean(form.available),
            id_ads: form.id_ads.trim() || null,
          },
        };

        const triggerRes = await fetch(
          buildStrapiUrl(`/api/triggers/${triggerDocId}`),
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(triggerPayload),
          }
        );

        const triggerBody = await triggerRes.json().catch(() => ({}));
        if (!triggerRes.ok) {
          const message =
            triggerBody?.error?.message ||
            "No se pudo actualizar el disparador. Intenta nuevamente.";
          setStatus({ loading: false, error: message });
          return;
        }

        // Actualizar o crear el contenido relacionado
        const existingContentId =
          initialTrigger?.trigger_contents?.[0]?.documentId ||
          initialTrigger?.trigger_contents?.[0]?.id ||
          initialTrigger?.messages?.[0]?.id || null;

        if (existingContentId) {
          const contentPayload = { data: { message: form.message.trim() } };
          const contentRes = await fetch(
            buildStrapiUrl(`/api/trigger-contents/${existingContentId}`),
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(contentPayload),
            }
          );
          // No bloquear por error en contenido
          if (!contentRes.ok) {
            const body = await contentRes.json().catch(() => ({}));
            console.error("Error actualizando contenido:", body);
            toast.warning(
              "Disparador actualizado pero hubo un error al guardar el mensaje."
            );
          }
        } else {
          // Crear contenido si no existe
          const contentPayload = {
            data: {
              message: form.message.trim(),
              trigger: { connect: [{ documentId: triggerDocId }] },
            },
          };
          const contentRes = await fetch(
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
          if (!contentRes.ok) {
            const body = await contentRes.json().catch(() => ({}));
            console.error("Error creando contenido:", body);
            toast.warning(
              "Disparador actualizado pero hubo un error al guardar el mensaje."
            );
          }
        }

        toast.success("Disparador actualizado correctamente.");
        setStatus({ loading: false, error: null });
      } else {
        // Crear nuevo trigger
        const triggerPayload = {
          data: {
            name: form.name.trim(),
            keywords: joined,
            keywords_ai: joinedAi,
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
          toast.warning(
            "Disparador creado pero hubo un error al guardar el mensaje."
          );
        }

        toast.success("Disparador creado correctamente.");
        setStatus({ loading: false, error: null });
      }

      const segment = chatbotSlug || chatbotId;
      router.push(`/dashboard/${encodeURIComponent(segment)}/triggers`);
    } catch (error) {
      console.error("Error en submit:", error);
      setStatus({
        loading: false,
        error: mode === "edit" ? "Error de red al actualizar el disparador." : "Error de red al crear el disparador.",
      });
    }
  };

  return (
    <Card className="w-full border-dashed border-muted-foreground/20 bg-muted/10">

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
                    Sera visible dentro del panel para identificar el disparador.
                  </FieldDescription>
                  <FieldError>{errors.name}</FieldError>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="trigger-id-ads">ID Ads (opcional)</FieldLabel>
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
                    Vincula este disparador con un anuncio o campaña especifica.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>

            <FieldSeparator />

            <FieldGroup className="gap-6">
              <Field data-invalid={errors.keywords ? true : undefined}>
                <FieldLabel htmlFor="trigger-keywords">Palabras clave</FieldLabel>
                <FieldContent>
                  <div className="rounded-lg border border-muted-foreground/20 bg-background px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {keywordsList.map((kw, index) => (
                        <span
                          key={`${kw}-${index}`}
                          className="inline-flex items-center rounded-md border border-muted-foreground/20 bg-muted/20 px-2 py-1 text-xs"
                        >
                          {kw}
                          <button
                            type="button"
                            onClick={() =>
                              setKeywordsList((prev) => prev.filter((_, i) => i !== index))
                            }
                            className="ml-2 rounded p-0.5 text-muted-foreground hover:bg-muted/40"
                            aria-label={`Quitar palabra ${kw}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <Input
                      id="trigger-keywords"
                      placeholder="Escribe una palabra y presiona espacio"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onBlur={() => {
                        const next = keywordInput.trim();
                        if (next) {
                          setKeywordsList((prev) =>
                            prev.includes(next) ? prev : [...prev, next]
                          );
                          setKeywordInput("");
                        }
                      }}
                      onKeyDown={(e) => {
                        const isSeparator = e.key === " " || e.key === "Enter" || e.key === ",";
                        if (isSeparator) {
                          e.preventDefault();
                          const next = keywordInput.trim();
                          if (next) {
                            setKeywordsList((prev) =>
                              prev.includes(next) ? prev : [...prev, next]
                            );
                            setKeywordInput("");
                          }
                        } else if (e.key === "Backspace" && keywordInput.length === 0) {
                          setKeywordsList((prev) => prev.slice(0, -1));
                        }
                      }}
                      className="mt-2"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <FieldDescription className="text-xs">
                        Palabras separadas por espacio. Se enviarán separadas por coma.
                      </FieldDescription>
                      <span>
                        {keywordsJoined.length}/{MAX_KEYWORDS_LENGTH}
                      </span>
                    </div>
                  </div>
                  <FieldError>{errors.keywords}</FieldError>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="trigger-keywords-ai">Palabras clave IA (opcional)</FieldLabel>
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
                <FieldLabel htmlFor="trigger-message">Mensaje de respuesta</FieldLabel>
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
                      El mensaje que se enviara cuando se detecten las palabras clave.
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
                      {form.available ? "Disparador disponible" : "Disparador desactivado"}
                    </p>
                    <FieldDescription className="text-xs md:text-sm">
                      Desactivalo temporalmente cuando quieras pausar la automatizacion.
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

        <CardFooter className="flex flex-col-reverse gap-3 border-t border-dashed border-muted-foreground/20 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-muted-foreground md:text-sm">
            Cuando se detecten las palabras clave, se ejecutara la respuesta configurada.
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const segment = chatbotSlug || chatbotId;
                router.push(`/dashboard/${encodeURIComponent(segment)}/triggers`);
              }}
              className="w-full md:w-auto"
              disabled={status.loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={status.loading || !token || !chatbotId}
            >
              {status.loading ? "Creando..." : "Crear disparador"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}