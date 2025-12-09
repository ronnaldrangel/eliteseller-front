"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { buildStrapiUrl } from "@/lib/strapi";
import {
  Loader2,
  Flame,
  Sparkles,
  Snowflake,
  MessageSquare,
  Trash2,
  FileVideo,
  ImageIcon,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

// --- Subcomponente: Item Individual (Texto o Media) con tiempo ---
function ContentItem({ item, index, onUpdate, onRemove }) {
  const isMedia = item.type === "media";
  const mime = String(item.mediaMime || (item.file && item.file.type) || "");
  const isVid = !!(item.isVideo || mime.startsWith("video"));
  const isImg = mime.startsWith("image");
  const fileName = (() => {
    if (item.file && item.file.name) return item.file.name;
    if (item.mediaUrl && typeof item.mediaUrl === "string") {
      try {
        const parts = item.mediaUrl.split("/");
        return parts[parts.length - 1] || "archivo";
      } catch {
        return "archivo";
      }
    }
    return "archivo";
  })();

  return (
    <div className="p-4 bg-background/50 rounded-lg border mb-3">
      <div className="grid grid-cols-[1fr_36px] gap-4 items-center">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-muted-foreground">
              Mensaje {index + 1}
            </span>
            <div className="flex gap-2 items-center">
              <Label className="text-xs text-muted-foreground">Tiempo:</Label>
              <Input
                type="number"
                min="1"
                placeholder="15"
                className="w-20 h-8 text-sm"
                value={item.time_to_send || ""}
                onChange={(e) =>
                  onUpdate({ ...item, time_to_send: e.target.value })
                }
              />
              <Select
                value={item.timeUnit || "minutes"}
                onValueChange={(val) => onUpdate({ ...item, timeUnit: val })}
              >
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutos</SelectItem>
                  <SelectItem value="hours">Horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            {isMedia ? (
              isVid ? (
                item.previewUrl || item.mediaUrl ? (
                  <video
                    src={item.previewUrl || item.mediaUrl}
                    className="w-full h-48 object-cover"
                    controls
                    muted
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center">
                    <FileVideo className="text-slate-400 w-10 h-10" />
                  </div>
                )
              ) : isImg ? (
                <img
                  src={item.previewUrl || item.mediaUrl}
                  alt=""
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full rounded border p-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-500" />
                  <span className="text-xs truncate" title={fileName}>
                    {fileName}
                  </span>
                </div>
              )
            ) : (
              <Textarea
                className="w-full text-sm min-h-[80px] resize-none focus-visible:ring-offset-0"
                placeholder="Escribe el mensaje..."
                value={item.content || ""}
                onChange={(e) => onUpdate({ ...item, content: e.target.value })}
              />
            )}
          </div>
        </div>
        <div className="flex items-center justify-center">
          <Button
            aria-label="Eliminar mensaje"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-70 hover:opacity-100"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Modal para gestionar los recordatorios ---
function ReminderForm({
  typeKey,
  config,
  data,
  chatbotId,
  token,
  itemsProp,
  onItemsChange,
  forceDeleteIds = [],
  onSaveSuccess,
}) {
  const [items, setItems] = useState(
    (Array.isArray(itemsProp) && itemsProp.length > 0)
      ? itemsProp
      : (data.items || [])
  );
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Sync internal state when parent items change (e.g., after copy)
  useEffect(() => {
    setItems(Array.isArray(itemsProp) ? itemsProp : (data.items || []));
  }, [itemsProp, data.items]);

  const addText = () => {
    const lastItem = items[items.length - 1];
    if (lastItem && lastItem.type === "text" && !lastItem.content?.trim()) {
      toast.warning("Completa el mensaje vacío antes de añadir otro.");
      return;
    }

    const next = [
      ...items,
      {
        id: `temp-txt-${Date.now()}`,
        type: "text",
        content: "",
        time_to_send: "",
        timeUnit: "minutes",
        isNew: true,
      },
    ];
    setItems(next);
    if (typeof onItemsChange === "function") onItemsChange(next);
  };

  const addMedia = (e) => {
    const lastItem = items[items.length - 1];
    if (lastItem && lastItem.type === "text" && !lastItem.content?.trim()) {
      toast.warning("Completa el mensaje vacío antes de añadir otro.");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");

    const next = [
      ...items,
      {
        id: `temp-media-${Date.now()}`,
        type: "media",
        file: file,
        previewUrl: objectUrl,
        isVideo: isVideo,
        content: "",
        time_to_send: "",
        timeUnit: "minutes",
        isNew: true,
      },
    ];
    setItems(next);
    if (typeof onItemsChange === "function") onItemsChange(next);
    e.target.value = null;
  };

  const updateItem = (index, newItem) => {
    const newItems = [...items];
    newItems[index] = newItem;
    setItems(newItems);
    if (typeof onItemsChange === "function") onItemsChange(newItems);
  };

  const removeItem = (index) => {
    const itemToRemove = items[index];
    if (!itemToRemove.isNew && itemToRemove.id) {
      setItemsToDelete([...itemsToDelete, itemToRemove.id]);
    }
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    if (typeof onItemsChange === "function") onItemsChange(next);
  };

  const handleSave = async () => {
    // Validar que todos los mensajes tengan tiempo
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.time_to_send || Number(item.time_to_send) <= 0) {
        toast.error(`El mensaje ${i + 1} necesita un tiempo válido`);
        return;
      }
      if (item.type === "text" && !item.content?.trim()) {
        toast.error(`El mensaje ${i + 1} no puede estar vacío`);
        return;
      }
    }

    setIsSaving(true);
    try {
      let parentId = data.id;

      // Crear el Remarketing padre si no existe
      if (!parentId) {
        const createRes = await fetch(buildStrapiUrl("/api/remarketings"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: {
              hotness: typeKey,
              chatbot: chatbotId,
            },
          }),
        });
        if (!createRes.ok) throw new Error("Error creando entidad padre");
        const createPayload = await createRes.json();
        parentId = createPayload.data.documentId || createPayload.data.id;
      }

      // Obtener los registros existentes por orden
      let existingByOrder = {};
      try {
        const qsExisting = new URLSearchParams();
        qsExisting.set("filters[remarketing][documentId][$eq]", parentId);
        qsExisting.set("pagination[pageSize]", "100");
        qsExisting.set("sort", "order:asc");

        const existingRes = await fetch(
          buildStrapiUrl(`/api/remarketing-contents?${qsExisting.toString()}`),
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );
        if (existingRes.ok) {
          const existingPayload = await existingRes.json();
          const existingItems = Array.isArray(existingPayload?.data)
            ? existingPayload.data
            : [];
          existingItems.forEach((entry, idx) => {
            const attrs = entry.attributes || entry;
            const ord = Number(attrs.order ?? idx);
            const id = entry.documentId || entry.id;
            if (Number.isFinite(ord) && id) existingByOrder[ord] = id;
          });
        }
      } catch { }

      // Procesar cada item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let mediaId = item.mediaId;

        // Subir media si es necesario
        if (item.isNew && item.type === "media" && item.file) {
          const formData = new FormData();
          formData.append("files", item.file);

          const uploadRes = await fetch(buildStrapiUrl("/api/upload"), {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            mediaId = uploadData[0].id;
          }
        }

        // Convertir tiempo a minutos
        const timeValue = Number(item.time_to_send) || 0;
        const timeInMinutes =
          item.timeUnit === "hours" ? timeValue * 60 : timeValue;

        const payload = {
          content: item.content || "",
          order: i,
          remarketing: parentId,
          media: mediaId ?? null,
          time_to_send: timeInMinutes,
        };

        const existingIdAtOrder = existingByOrder[i];
        const targetId = !item.isNew ? item.id || existingIdAtOrder : null;

        if (targetId) {
          await fetch(buildStrapiUrl(`/api/remarketing-contents/${targetId}`), {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ data: payload }),
          });
        } else {
          await fetch(buildStrapiUrl("/api/remarketing-contents"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ data: payload }),
          });
        }
      }

      // Eliminar items marcados y forzados por reemplazo
      const allIdsToDelete = Array.from(new Set([...(itemsToDelete || []), ...((forceDeleteIds || []).filter(Boolean))]));
      for (const idToDelete of allIdsToDelete) {
        await fetch(buildStrapiUrl(`/api/remarketing-contents/${idToDelete}`), {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setItemsToDelete([]);
      toast.success(`Recordatorios guardados para ${config.label}`);
      onSaveSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="space-y-4 py-4">
        {items.length === 0 && (
          <div className="text-center py-8 border border-dashed rounded-lg bg-background/30 text-sm text-muted-foreground">
            No hay mensajes configurados. Añade el primer mensaje.
          </div>
        )}

        {items.map((item, idx) => (
          <ContentItem
            key={item.id}
            item={item}
            index={idx}
            onUpdate={(updated) => updateItem(idx, updated)}
            onRemove={() => removeItem(idx)}
          />
        ))}

        <div className="flex gap-2 pt-4">
          <Button
            onClick={addText}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <MessageSquare className="w-4 h-4 mr-2" /> Añadir mensaje
          </Button>

          <div className="relative flex-1">
            <input
              type="file"
              id={`upload-modal-${typeKey}`}
              className="hidden"
              accept="image/*,video/*"
              onChange={addMedia}
            />
            <Button
              onClick={() =>
                document.getElementById(`upload-modal-${typeKey}`)?.click()
              }
              variant="outline"
              size="sm"
              className="w-full"
            >
              <ImageIcon className="w-4 h-4 mr-2" /> Añadir multimedia
            </Button>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </div>
  );
}

// --- Tarjeta de Sección (Hot/Normal/Cold) ---
function RemarketingCard({ typeKey, config, data, chatbotId, token, items, onItemsChange, onCopy, forceDeleteIds, onSaveSuccess }) {
  const Icon = config.icon;
  const messageCount = items?.length || 0;

  return (
    <div
      className={`flex flex-col rounded-xl border p-6 ${config.areaClass} h-full`}
    >
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${config.badgeClass}`}
          >
            <Icon className="h-4 w-4" />
            {config.label}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Copiar a</span>
            <Select onValueChange={(val) => onCopy && onCopy(val)}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {(["hot", "normal", "cold"]).filter((k) => k !== typeKey).map((k) => (
                  <SelectItem key={k} value={k}>{k === "hot" ? "Hot" : k === "normal" ? "Normal" : "Cold"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {config.description}
        </p>
        {messageCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {messageCount} {messageCount === 1 ? "mensaje" : "mensajes"}{" "}
            configurado{messageCount === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <ReminderForm
        typeKey={typeKey}
        config={config}
        data={data}
        chatbotId={chatbotId}
        token={token}
        itemsProp={items}
        onItemsChange={onItemsChange}
        forceDeleteIds={forceDeleteIds}
        onSaveSuccess={onSaveSuccess}
      />
    </div>
  );
}

// --- Componente Principal ---
export default function ReminderMessages({
  token,
  chatbotSlug,
  chatbotId,
  initialData = { hot: {}, normal: {}, cold: {} },
}) {
  const messageTypes = [
    {
      key: "hot",
      label: "Hot",
      description:
        "Mensajes de seguimiento inmediato para leads con alta intención de compra.",
      icon: Flame,
      badgeClass:
        "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100",
      areaClass:
        "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900",
    },
    {
      key: "normal",
      label: "Normal",
      description:
        "Mensajes regulares para mantener la conversación activa con leads interesados.",
      icon: Sparkles,
      badgeClass:
        "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100",
      areaClass:
        "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900",
    },
    {
      key: "cold",
      label: "Cold",
      description:
        "Mensajes para reenganchar contactos fríos que han perdido interés.",
      icon: Snowflake,
      badgeClass:
        "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-100",
      areaClass:
        "bg-sky-50/70 dark:bg-sky-950/30 border-sky-200/60 dark:border-sky-900",
    },
  ];

  const handleSaveSuccess = () => {
    // Aquí podrías recargar los datos o actualizar el estado
    // window.location.reload();
  };

  const [itemsByType, setItemsByType] = useState(() => {
    const initial = {};
    for (const mt of messageTypes) {
      const d = initialData[mt.key] || { items: [] };
      const processed = (d.items || []).map((item) => {
        const minutes = Number(item.time_to_send) || 0;
        const isHours = minutes > 0 && minutes % 60 === 0;
        return {
          ...item,
          timeUnit: isHours ? "hours" : "minutes",
          time_to_send: isHours ? String(minutes / 60) : String(minutes),
          isNew: false,
        };
      });
      initial[mt.key] = processed;
    }
    return initial;
  });

  const [forceDeleteByType, setForceDeleteByType] = useState({});

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 items-stretch">
        {messageTypes.map((cfg) => {
          const data = initialData[cfg.key] || { items: [] };
          const onItemsChange = (next) =>
            setItemsByType((prev) => ({ ...prev, [cfg.key]: next }));

          const onCopy = (destKey) => {
            setItemsByType((prevItems) => {
              const idsToDelete = (prevItems[destKey] || [])
                .filter((it) => !it.isNew && it.id)
                .map((it) => it.id);

              setForceDeleteByType((prevDel) => ({
                ...prevDel,
                [destKey]: idsToDelete,
              }));

              const copied = (prevItems[cfg.key] || []).map((it, idx) => {
                const tempPrefix = it.type === "media" ? "temp-media" : "temp-txt";
                const isVid = it.isVideo ?? String(it.mediaMime || "").startsWith("video");
                const next = {
                  ...it,
                  id: `${tempPrefix}-${Date.now()}-${idx}`,
                  isNew: true,
                };
                if (it.type === "media") {
                  next.previewUrl = it.mediaUrl || it.previewUrl || undefined;
                  next.isVideo = isVid;
                  // mantener referencias para que se creen contenidos apuntando a la misma media
                  next.mediaId = it.mediaId || null;
                  next.mediaUrl = it.mediaUrl || null;
                  next.mediaMime = it.mediaMime || null;
                  next.file = undefined;
                }
                return next;
              });

              const next = { ...prevItems, [destKey]: copied };
              toast.success(`Copiado desde ${cfg.label} a ${destKey === "hot" ? "Hot" : destKey === "normal" ? "Normal" : "Cold"}`);
              return next;
            });
          };

          return (
            <RemarketingCard
              key={cfg.key}
              typeKey={cfg.key}
              config={cfg}
              data={data}
              chatbotId={chatbotId}
              token={token}
              items={itemsByType[cfg.key] || []}
              onItemsChange={onItemsChange}
              onCopy={onCopy}
              forceDeleteIds={forceDeleteByType[cfg.key] || []}
              onSaveSuccess={handleSaveSuccess}
            />
          );
        })}
      </div>
    </div>
  );
}
