"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { buildStrapiUrl } from "@/lib/strapi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

export default function NewTriggerForm({
  token,
  chatbotId,
  chatbotSlug,
  initialTrigger = null,
  mode = "create",
}) {
  const router = useRouter();

  // Cargar mensajes existentes
  const initialMessages = useMemo(() => {
    const contents =
      initialTrigger?.trigger_contents || initialTrigger?.messages || [];
    return contents.map((tc, index) => ({
      id: tc.id || tc.documentId || `temp-${index}`,
      documentId: tc.documentId || tc.id || null,
      message: tc.message || "",
      isExisting: true,
    }));
  }, [initialTrigger]);

  const initialKeywordsString = (initialTrigger?.keywords ?? "").trim();
  const initialKeywordsList = useMemo(
    () => initialKeywordsString.split(/[\,\s]+/).filter(Boolean),
    [initialKeywordsString]
  );

  const [form, setForm] = useState({
    name: initialTrigger?.name ?? "",
    keywords_ai: initialTrigger?.keywords_ai ?? "",
    available: initialTrigger?.available ?? true,
    id_ads: initialTrigger?.id_ads ?? "",
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ loading: false, error: null });
  const [keywordsList, setKeywordsList] = useState(() => [...initialKeywordsList]);
  const [keywordInput, setKeywordInput] = useState("");
  const [messages, setMessages] = useState(
    initialMessages.length > 0 ? initialMessages : []
  );
  const [newMessage, setNewMessage] = useState("");

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

    if (messages.length === 0) {
      nextErrors.messages = "Agrega al menos un mensaje de respuesta.";
    }

    // Validar cada mensaje
    const hasInvalidMessage = messages.some(
      (msg) => !msg.message.trim() || msg.message.length > MAX_MESSAGE_LENGTH
    );
    if (hasInvalidMessage) {
      nextErrors.messages = `Todos los mensajes deben tener contenido y maximo ${MAX_MESSAGE_LENGTH} caracteres.`;
    }

    return nextErrors;
  };

  const handleAddMessage = () => {
    if (!newMessage.trim()) return;
    if (newMessage.length > MAX_MESSAGE_LENGTH) {
      toast.error(
        `El mensaje debe tener maximo ${MAX_MESSAGE_LENGTH} caracteres.`
      );
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        documentId: null,
        message: newMessage.trim(),
        isExisting: false,
      },
    ]);
    setNewMessage("");
  };

  const handleRemoveMessage = (index) => {
    setMessages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMessage = (index, value) => {
    setMessages((prev) =>
      prev.map((msg, i) => (i === index ? { ...msg, message: value } : msg))
    );
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

        // Gestionar los mensajes: actualizar existentes y crear nuevos
        let hasErrors = false;

        for (const msg of messages) {
          if (msg.isExisting && msg.documentId) {
            // Actualizar mensaje existente
            const contentPayload = { data: { message: msg.message.trim() } };
            const contentRes = await fetch(
              buildStrapiUrl(`/api/trigger-contents/${msg.documentId}`),
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(contentPayload),
              }
            );

            if (!contentRes.ok) {
              const body = await contentRes.json().catch(() => ({}));
              console.error("Error actualizando contenido:", contentRes);
              hasErrors = true;
            }
          } else {
            // Crear nuevo mensaje
            const contentPayload = {
              data: {
                message: msg.message.trim(),
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
              hasErrors = true;
            }
          }
        }

        // Eliminar mensajes que ya no están en la lista
        const existingIds = messages
          .filter((m) => m.isExisting && m.documentId)
          .map((m) => m.documentId);
        const originalIds = initialMessages
          .map((m) => m.documentId)
          .filter(Boolean);
        const toDelete = originalIds.filter((id) => !existingIds.includes(id));

        for (const docId of toDelete) {
          await fetch(buildStrapiUrl(`/api/trigger-contents/${docId}`), {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }).catch((err) => console.error("Error eliminando contenido:", err));
        }

        if (hasErrors) {
          toast.warning(
            "Disparador actualizado pero hubo errores al guardar algunos mensajes."
          );
        } else {
          toast.success("Disparador actualizado correctamente.");
        }

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
          triggerPayload.data.chatbot = {
            connect: [{ documentId: chatbotId }],
          };
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

        // Crear todos los mensajes
        let hasErrors = false;
        for (const msg of messages) {
          const contentPayload = {
            data: {
              message: msg.message.trim(),
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

          if (!contentResponse.ok) {
            const body = await contentResponse.json().catch(() => ({}));
            console.error("Error creando trigger_content:", body);
            hasErrors = true;
          }
        }

        if (hasErrors) {
          toast.warning(
            "Disparador creado pero hubo errores al guardar algunos mensajes."
          );
        } else {
          toast.success("Disparador creado correctamente.");
        }

        setStatus({ loading: false, error: null });
      }

      const segment = chatbotSlug || chatbotId;
      router.push(`/dashboard/${encodeURIComponent(segment)}/triggers`);
    } catch (error) {
      console.error("Error en submit:", error);
      setStatus({
        loading: false,
        error:
          mode === "edit"
            ? "Error de red al actualizar el disparador."
            : "Error de red al crear el disparador.",
      });
    }
  };

  return (
    <Card className="w-full border-dashed border-muted-foreground/20 bg-muted/10">
      <form onSubmit={handleSubmit} className="contents">
        <CardHeader className="flex items-start justify-between">
          <div>
            <CardTitle>
              {mode === "edit" ? "Editar disparador" : "Nuevo disparador"}
            </CardTitle>
            <CardDescription>
              Define el nombre, palabras clave y mensajes de respuesta.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="trigger-available"
              checked={!!form.available}
              onCheckedChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  available: !!value,
                }))
              }
              aria-label="Estado activo"
            />
            <span className="text-sm text-muted-foreground">
              {form.available ? "Activo" : "Inactivo"}
            </span>
          </div>
        </CardHeader>
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
                    placeholder="Ej. 023232323232121"
                    value={form.id_ads}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        id_ads: event.target.value,
                      }))
                    }
                  />
                  <FieldDescription>
                    Vincula este disparador con un anuncio o campana especifica.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>

            <FieldGroup className="gap-6">
              <Field data-invalid={errors.keywords ? true : undefined}>
                <FieldLabel htmlFor="trigger-keywords">
                  Palabras clave
                </FieldLabel>
                <FieldContent>
                  <div>
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
                              setKeywordsList((prev) =>
                                prev.filter((_, i) => i !== index)
                              )
                            }
                            className="ml-2 rounded p-0.5 text-muted-foreground hover:bg-muted/40"
                            aria-label={`Quitar palabra ${kw}`}
                          >
                            x
                          </button>
                        </span>
                      ))}
                    </div>
                    <Input
                      id="trigger-keywords"
                      placeholder="Escribe una palabra y presiona enter"
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
                        const isSeparator =
                          e.key === " " || e.key === "Enter" || e.key === ",";
                        if (isSeparator) {
                          e.preventDefault();
                          const next = keywordInput.trim();
                          if (next) {
                            setKeywordsList((prev) =>
                              prev.includes(next) ? prev : [...prev, next]
                            );
                            setKeywordInput("");
                          }
                        } else if (
                          e.key === "Backspace" &&
                          keywordInput.length === 0
                        ) {
                          setKeywordsList((prev) => prev.slice(0, -1));
                        }
                      }}
                      className="mt-2"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {keywordsJoined.length}/{MAX_KEYWORDS_LENGTH}
                      </span>
                    </div>
                  </div>
                  <FieldError>{errors.keywords}</FieldError>
                </FieldContent>
              </Field>

              {/* Palabras clave IA han sido comentadas por ahoraaa  */}

              {/* <Field>
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
              </Field> */}

              <Field data-invalid={errors.messages ? true : undefined}>
                <FieldLabel htmlFor="trigger-messages">
                  Mensajes de respuesta
                </FieldLabel>
                <FieldContent>
                  <div className="space-y-3">
                    {/* Lista de mensajes existentes */}
                    {messages.map((msg, index) => (
                      <div
                        key={msg.id}
                        // className="rounded-lg border border-muted-foreground/20 bg-background p-3"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <Textarea
                              rows={3}
                              maxLength={MAX_MESSAGE_LENGTH}
                              placeholder="Escribe el mensaje de respuesta"
                              value={msg.message}
                              onChange={(e) =>
                                handleUpdateMessage(index, e.target.value)
                              }
                              className="resize-none"
                            />
                            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                              <span>Mensaje {index + 1}</span>
                              <span>
                                {msg.message.length}/{MAX_MESSAGE_LENGTH}
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMessage(index)}
                            className="flex-shrink-0"
                            aria-label="Eliminar mensaje"
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Campo para agregar nuevo mensaje */}
                    <div>
                    {/* <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 p-3"> */}
                      <Textarea
                        id="trigger-messages"
                        rows={3}
                        maxLength={MAX_MESSAGE_LENGTH}
                        placeholder="Escribe un nuevo mensaje y presiona Agregar"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.ctrlKey) {
                            e.preventDefault();
                            handleAddMessage();
                          }
                        }}
                        className="resize-none"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {newMessage.length}/{MAX_MESSAGE_LENGTH}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddMessage}
                          disabled={!newMessage.trim()}
                        >
                          <PlusIcon className="size-4 mr-2" />
                          Agregar mensaje
                        </Button>
                      </div>
                    </div>

                    <FieldError>{errors.messages}</FieldError>
                  </div>
                </FieldContent>
              </Field>
            </FieldGroup>

            
          </FieldSet>

          {status.error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {status.error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col-reverse gap-3 border-t border-dashed border-muted-foreground/20 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-muted-foreground md:text-sm">
            {messages.length > 0
              ? `${messages.length} mensaje${
                  messages.length > 1 ? "s" : ""
                } configurado${messages.length > 1 ? "s" : ""}.`
              : "Agrega al menos un mensaje de respuesta."}
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const segment = chatbotSlug || chatbotId;
                router.push(
                  `/dashboard/${encodeURIComponent(segment)}/triggers`
                );
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
              {status.loading
                ? mode === "edit"
                  ? "Actualizando..."
                  : "Creando..."
                : mode === "edit"
                ? "Actualizar disparador"
                : "Crear disparador"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

