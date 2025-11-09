"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
// [Cambio] Agrego Upload para el ícono del dropzone; ya estaba FileIcon
import {
  Paperclip,
  PlusIcon,
  Trash2Icon,
  File as FileIcon,
  Upload, // [Cambio]
} from "lucide-react";
import { buildStrapiUrl } from "@/lib/strapi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const MAX_KEYWORDS_LENGTH = 360;
const MAX_MESSAGE_LENGTH = 500;

const ACCEPT =
  "image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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
    return contents.map((tc, index) => {
      const attrs = tc.attributes || tc;
      const mediaNodes = attrs?.messageMedia?.data || [];
      const existingMedia = mediaNodes.map((m) => ({
        id: m.id,
        name: m.attributes?.name || `file-${m.id}`,
        url: m.attributes?.url,
        size: m.attributes?.size,
      }));
      const inferredType =
        attrs?.type ||
        (attrs?.message?.trim()
          ? "message"
          : existingMedia.length > 0
          ? "media"
          : "message");
      return {
        id: tc.id || tc.documentId || `temp-${index}`,
        documentId: tc.documentId || tc.id || null,
        message: attrs?.message || tc.message || "",
        isExisting: true,
        mediaExisting: existingMedia,
        mediaNew: [],
        type: inferredType,
      };
    });
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
  const [keywordsList, setKeywordsList] = useState(() => [
    ...initialKeywordsList,
  ]);
  const [keywordInput, setKeywordInput] = useState("");
  const [messages, setMessages] = useState(
    initialMessages.length > 0 ? initialMessages : []
  );
  const [newMessage, setNewMessage] = useState("");
  const [newMediaFiles, setNewMediaFiles] = useState([]);
  const [newType, setNewType] = useState("message");

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

    // Validar cada mensaje por tipo
    const hasInvalid = messages.some((msg) => {
      const hasText = !!msg.message?.trim();
      const hasMedia =
        (msg.mediaExisting && msg.mediaExisting.length > 0) ||
        (msg.mediaNew && msg.mediaNew.length > 0);
      const textTooLong = (msg.message || "").length > MAX_MESSAGE_LENGTH;
      const invalidByType =
        (msg.type === "message" && (!hasText || hasMedia)) ||
        (msg.type === "media" && (!hasMedia || hasText));
      return invalidByType || textTooLong;
    });
    if (hasInvalid) {
      nextErrors.messages =
        `Cada respuesta debe ser solo de un tipo:` +
        `\n- Mensaje: texto (sin archivos)` +
        `\n- Multimedia: archivos (sin texto)` +
        `\nAdemás, el texto no debe exceder ${MAX_MESSAGE_LENGTH} caracteres.`;
    }

    return nextErrors;
  };

  async function uploadFiles(files = []) {
    if (!files.length) return [];
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    const res = await fetch(buildStrapiUrl("/api/upload"), {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Fallo subiendo archivos");
    }
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map((asset) => asset.id);
  }

  const handleAddMessage = () => {
    const hasText = !!newMessage.trim();
    const hasMedia = newMediaFiles.length > 0;
    if (newType === "message" && !hasText) return;
    if (newType === "media" && !hasMedia) return;

    if (hasText && newMessage.length > MAX_MESSAGE_LENGTH) {
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
        message: newType === "message" ? newMessage.trim() : "",
        isExisting: false,
        mediaExisting: [],
        mediaNew: newType === "media" ? [...newMediaFiles] : [],
        type: newType,
      },
    ]);
    setNewMessage("");
    setNewMediaFiles([]);
    setNewType("message");
  };

  const handleChangeType = (index, next) => {
    setMessages((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        return {
          ...m,
          type: next,
          message: next === "message" ? m.message : "",
          mediaNew: next === "media" ? m.mediaNew : [],
          mediaExisting: next === "media" ? m.mediaExisting : [],
        };
      })
    );
  };

  const handleChangeNewType = (next) => {
    setNewType(next);
    if (next === "message") setNewMediaFiles([]);
    else setNewMessage("");
  };

  const handleRemoveMessage = (index) => {
    setMessages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMessage = (index, value) => {
    setMessages((prev) =>
      prev.map((msg, i) => (i === index ? { ...msg, message: value } : msg))
    );
  };

  // [Cambio] Reemplazo por lógica de UN SOLO archivo
  const handleAddMediaToMessage = (index, fileList) => {
    const files = Array.from(fileList || []);
    const first = files[0];
    if (!first) return;
    setMessages((prev) =>
      prev.map((msg, i) =>
        i === index
          ? {
              ...msg,
              mediaExisting: [], // si había existentes, los quitamos
              mediaNew: [first], // guardamos SOLO 1
            }
          : msg
      )
    );
  };

  const handleRemoveMedia = (index, type, idx) => {
    setMessages((prev) =>
      prev.map((msg, i) => {
        if (i !== index) return msg;
        if (type === "new") {
          return { ...msg, mediaNew: [] }; // [Cambio] al ser único, limpiamos todo
        } else {
          return { ...msg, mediaExisting: [] }; // [Cambio]
        }
      })
    );
  };

  // [Cambio] Nuevo: solo 1 archivo para el bloque “nuevo contenido”
  const handleAddMediaToNew = (fileList) => {
    const files = Array.from(fileList || []);
    const first = files[0];
    if (!first) return;
    setNewMediaFiles([first]); // solo 1
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

        // Gestionar contenidos
        let hasErrors = false;

        for (const msg of messages) {
          let uploadedIds = [];
          try {
            uploadedIds = await uploadFiles(msg.mediaNew || []);
          } catch (e) {
            console.error("Upload fallido:", e);
            hasErrors = true;
          }

          const existingIds = (msg.mediaExisting || []).map((m) => m.id);
          const allMediaIds = [...existingIds, ...uploadedIds];

          if (msg.isExisting && msg.documentId) {
            const contentPayload = {
              data: {
                type: msg.type,
                message:
                  msg.type === "message" ? (msg.message || "").trim() : "",
                messageMedia: msg.type === "media" ? allMediaIds : [],
              },
            };
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
              console.error("Error actualizando contenido:", body);
              hasErrors = true;
            }
          } else {
            const contentPayload = {
              data: {
                type: msg.type,
                message:
                  msg.type === "message" ? (msg.message || "").trim() : "",
                messageMedia: msg.type === "media" ? allMediaIds : [],
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

        // Eliminar contenidos removidos
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

        let hasErrors = false;
        for (const msg of messages) {
          let uploadedIds = [];
          try {
            uploadedIds = await uploadFiles(msg.mediaNew || []);
          } catch (e) {
            console.error("Upload fallido:", e);
            hasErrors = true;
          }
          const existingIds2 = (msg.mediaExisting || []).map((m) => m.id);
          const allMediaIds = [...existingIds2, ...uploadedIds];

          const contentPayload = {
            data: {
              type: msg.type,
              message: msg.type === "message" ? (msg.message || "").trim() : "",
              messageMedia: msg.type === "media" ? allMediaIds : [],
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

        if (hasErrors)
          toast.warning("Disparador creado con algunos errores en multimedia.");
        else toast.success("Disparador creado correctamente.");

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

  /** File del navegador? (sin romper en SSR) */
  function isBrowserFile(x) {
    return typeof File !== "undefined" && x instanceof File;
  }

  /** Determina tipo para preview */
  function detectKind(fileLike) {
    const mime = fileLike?.type || fileLike?.mime;
    const name = fileLike?.name || fileLike?.url || "";
    const ext = (name.split(".").pop() || "").toLowerCase();

    const isImg =
      (mime && mime.startsWith("image/")) ||
      ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);

    const isVid =
      (mime && mime.startsWith("video/")) ||
      ["mp4", "webm", "ogg"].includes(ext);

    if (isImg) return "image";
    if (isVid) return "video";
    return "other";
  }

  // [NUEVO] Formatea bytes a KB/MB legibles
  function formatBytes(bytes = 0) {
    if (!bytes || isNaN(bytes)) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(i ? 2 : 0)}${sizes[i]}`;
  }

  // [REEMPLAZO] Card con preview grande + footer oscuro con nombre truncado
  function MediaCard({ fileLike, onRemove }) {
    const kind = detectKind(fileLike);
    const [previewSrc, setPreviewSrc] = useState(null);

    useEffect(() => {
      let url;
      if (!fileLike) return;

      // File del navegador → blob
      if (isBrowserFile(fileLike)) {
        url = URL.createObjectURL(fileLike);
        setPreviewSrc(url);
        return () => {
          try {
            URL.revokeObjectURL(url);
          } catch {}
        };
      }

      // Activo existente (Strapi): resolver URL absoluta
      const raw = fileLike?.url || fileLike?.attributes?.url || null;
      if (raw) {
        const abs = /^https?:\/\//i.test(raw) ? raw : buildStrapiUrl(raw);
        setPreviewSrc(abs);
      } else {
        setPreviewSrc(null);
      }
    }, [fileLike]);

    // Nombre a mostrar (último segmento) y tamaño
    const displayName = (() => {
      const raw = fileLike?.name || fileLike?.url || "archivo";
      try {
        const u = new URL(
          raw,
          typeof window !== "undefined"
            ? window.location.href
            : "http://localhost"
        );
        const last = u.pathname.split("/").filter(Boolean).pop();
        return last || raw;
      } catch {
        return raw;
      }
    })();

    const size =
      typeof fileLike?.size === "number"
        ? fileLike.size
        : typeof fileLike?.attributes?.size === "number"
        ? fileLike.attributes.size
        : undefined;

    return (
      <div className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Preview (4:3) */}
        <div className="relative aspect-[4/3] w-full bg-muted/40">
          {kind === "image" && previewSrc ? (
            <img
              src={previewSrc}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : kind === "video" && previewSrc ? (
            <video
              src={previewSrc}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
              controls={false}
              onLoadedData={(e) => {
                e.currentTarget.currentTime = 0;
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <FileIcon className="h-10 w-10 text-muted-foreground/70" />
            </div>
          )}

          {/* Botón quitar (hover) */}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute right-2 top-2 rounded-md bg-background/80 px-2 py-1 text-[11px] font-medium text-foreground shadow transition-opacity hover:bg-background group-hover:opacity-100 opacity-0"
            >
              Quitar
            </button>
          )}
        </div>

        {/* Footer con nombre truncado y tamaño */}
        <div className="space-y-1 bg-muted/80 px-3 py-2">
          <div
            className="truncate text-[13px] font-medium leading-5"
            title={displayName}
          >
            {displayName}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {size ? formatBytes(size) : ""}
          </div>
        </div>
      </div>
    );
  }

  // [Cambio] Pequeño componente para el “dropzone button” con estilo nuevo
  function DropzoneButton({ id, onChange }) {
    return (
      <label
        htmlFor={id}
        className="relative block rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
      >
        <div className="flex h-32 w-full flex-col items-center justify-center gap-2">
          <div className="rounded-full bg-muted/50 p-2">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm">
            <span className="font-medium">Suelta archivos aquí</span>{" "}
            <span className="text-muted-foreground">o</span>{" "}
            <span className="text-primary underline">examinar archivos</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Acepta imágenes, videos o documentos
          </p>
        </div>

        {/* [Cambio] input ocupa toda el área pero es invisible */}
        <input
          id={id}
          type="file"
          accept={ACCEPT}
          // [Cambio] sin multiple
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={onChange}
        />
      </label>
    );
  }

  // [Cambio] Layout en dos columnas con un Card lateral para mensajes/multimedia
  return (
    <div className="xl:grid xl:grid-cols-[1fr_420px] xl:items-start gap-6 space-y-6 xl:space-y-0">
      <Card className="w-full border-dashed border-muted-foreground/20 bg-muted/10">
        <form onSubmit={handleSubmit} className="contents">
          <CardHeader className="flex items-start justify-between">
            <div>
              <CardTitle>
                {mode === "edit" ? "Editar disparador" : "Nuevo disparador"}
              </CardTitle>
              <CardDescription>
                Define el nombre, palabras clave y configuración general.
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
                      Será visible dentro del panel para identificar el
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
                      Vincula este disparador con un anuncio o campaña
                      específica.
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

      {/* [Cambio] Card lateral independiente para Mensajes/Multimedia (2da columna en desktop) */}
      <Card className="border-dashed border-muted-foreground/20 bg-muted/10">
        <CardHeader>
          <CardTitle>Respuestas</CardTitle>
          <CardDescription>
            Agrega mensajes o archivos multimedia. En escritorio se muestra como
            una columna aparte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contenidos existentes/edición */}
          {messages.map((msg, index) => {
            const hasAnyMedia =
              (msg.mediaExisting?.length || 0) + (msg.mediaNew?.length || 0) >
              0;

            return (
              <div
                key={msg.id}
                className="rounded-lg border border-muted-foreground/20 bg-background p-3"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <div className="flex-1 w-0 min-w-0">
                    {/* Tipo */}
                    <div className="mb-2 flex items-center gap-4 text-sm">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name={`type-${msg.id}`}
                          value="message"
                          checked={msg.type === "message"}
                          onChange={() => handleChangeType(index, "message")}
                        />
                        Mensaje
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name={`type-${msg.id}`}
                          value="media"
                          checked={msg.type === "media"}
                          onChange={() => handleChangeType(index, "media")}
                        />
                        Multimedia
                      </label>
                    </div>

                    {msg.type === "message" ? (
                      <>
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
                            {(msg.message || "").length}/{MAX_MESSAGE_LENGTH}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Existentes */}
                        {msg.mediaExisting?.length ? (
                          <>
                            <div className="mb-1 text-xs font-medium text-muted-foreground">
                              Files ({msg.mediaExisting.length})
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {msg.mediaExisting.map((m, i) => (
                                <MediaCard
                                  key={`ex-${i}`}
                                  fileLike={m}
                                  onRemove={() =>
                                    handleRemoveMedia(index, "existing", i)
                                  }
                                />
                              ))}
                            </div>
                          </>
                        ) : null}

                        {/* Nuevos (previews) */}
                        {msg.mediaNew?.length ? (
                          <>
                            <div className="mt-3 mb-1 text-xs font-medium text-muted-foreground">
                              Files nuevos ({msg.mediaNew.length})
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {msg.mediaNew.map((f, i) => (
                                <MediaCard
                                  key={`new-${i}`}
                                  fileLike={f}
                                  onRemove={() =>
                                    handleRemoveMedia(index, "new", i)
                                  }
                                />
                              ))}
                            </div>
                          </>
                        ) : null}

                        {/* [Cambio] Dropzone nuevo SOLO si no hay archivo */}
                        {!hasAnyMedia && (
                          <div className="mt-3">
                            <DropzoneButton
                              id={`add-media-${msg.id}`}
                              onChange={(e) =>
                                handleAddMediaToMessage(index, e.target.files)
                              }
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMessage(index)}
                    className="shrink-0 my-auto hover:cursor-pointer"
                    aria-label="Eliminar mensaje"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Nuevo contenido */}
          <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 p-3">
            <div className="mb-2 flex items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="new-type"
                  value="message"
                  checked={newType === "message"}
                  onChange={() => setNewType("message")}
                />
                Mensaje
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="new-type"
                  value="media"
                  checked={newType === "media"}
                  onChange={() => setNewType("media")}
                />
                Multimedia
              </label>
            </div>

            {newType === "message" ? (
              <>
                <Textarea
                  rows={3}
                  maxLength={MAX_MESSAGE_LENGTH}
                  placeholder="Escribe un nuevo mensaje"
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
                    Agregar
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* [Cambio] Dropzone estilo nuevo (solo 1 archivo) */}
                {newMediaFiles.length === 0 ? (
                  <DropzoneButton
                    id="new-media-drop"
                    onChange={(e) => handleAddMediaToNew(e.target.files)}
                  />
                ) : null}

                {/* Previews de nuevos archivos */}
                {newMediaFiles.length ? (
                  <>
                    <div className="mt-3 mb-1 text-xs font-medium text-muted-foreground">
                      Files ({newMediaFiles.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <MediaCard
                        fileLike={newMediaFiles[0]}
                        onRemove={() => setNewMediaFiles([])}
                      />
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddMessage}
                        className="shrink-0"
                      >
                        <PlusIcon className="size-4 mr-2" />
                        Agregar
                      </Button>
                    </div>
                  </>
                ) : null}
              </>
            )}
          </div>

          <FieldError>{errors.messages}</FieldError>
        </CardContent>
      </Card>
      {/* [/Cambio] */}
    </div>
  );
}
