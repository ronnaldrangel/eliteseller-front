"use client";

import { useState } from "react";
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
  Image as ImageIcon,
  MessageSquare,
  Trash2,
  FileVideo,
} from "lucide-react";
import { toast } from "sonner";

// --- Subcomponente: Item Individual (Texto o Media) ---
function ContentItem({ item, index, onUpdate, onRemove }) {
  const isMedia = item.type === "media";

  return (
    <div className="flex gap-2 items-start p-3 bg-background/50 rounded-md border mb-2 group relative">
      <span className="text-[10px] font-bold text-muted-foreground mt-1 min-w-[12px]">
        {index + 1}.
      </span>

      <div className="flex-1 space-y-2">
        {isMedia ? (
          <div className="flex gap-3 items-center">
            {/* Preview solo (sin descripción) */}
            <div className="w-24 h-24 bg-slate-100 rounded border overflow-hidden flex-shrink-0 flex items-center justify-center">
              {item.isVideo ||
              (item.mediaMime && item.mediaMime.startsWith("video")) ? (
                item.previewUrl || item.mediaUrl ? (
                  <video
                    src={item.previewUrl || item.mediaUrl}
                    className="w-full h-full object-cover"
                    controls
                    muted
                  />
                ) : (
                  <FileVideo className="text-slate-400 w-8 h-8" />
                )
              ) : (
                <img
                  src={item.previewUrl || item.mediaUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="text-xs text-muted-foreground italic">
              {item.isVideo ? "Video adjunto" : "Imagen adjunta"}
            </div>
          </div>
        ) : (
          <Textarea
            className="text-sm min-h-[60px] resize-none focus-visible:ring-offset-0"
            placeholder="Escribe el mensaje..."
            value={item.content || ""}
            onChange={(e) => onUpdate({ ...item, content: e.target.value })}
            autoFocus // Opcional: para enfocar automáticamente al crear
          />
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-destructive hover:bg-destructive/10 opacity-70 hover:opacity-100"
        onClick={onRemove}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// --- Subcomponente: Tarjeta de Sección (Hot/Normal/Cold) ---
function RemarketingCard({
  typeKey,
  config,
  data,
  chatbotId,
  token,
  loadingKey,
  setLoadingKey,
}) {
  const [items, setItems] = useState(data.items || []);
  const [itemsToDelete, setItemsToDelete] = useState([]);

  // LOGICA CAMBIADA: Validar último texto vacío
  const addText = () => {
    const lastItem = items[items.length - 1];

    // Si existe un último elemento, es de tipo texto y está vacío (o solo espacios)
    if (lastItem && lastItem.type === "text" && !lastItem.content?.trim()) {
      toast.warning("Completa el mensaje vacío antes de añadir otro.");
      return;
    }

    setItems([
      ...items,
      { id: `temp-txt-${Date.now()}`, type: "text", content: "", isNew: true },
    ]);
  };

  const addMedia = (e) => {
    const lastItem = items[items.length - 1];

    // Si existe un último elemento, es de tipo texto y está vacío (o solo espacios)
    if (lastItem && lastItem.type === "text" && !lastItem.content?.trim()) {
      toast.warning("Completa el mensaje vacío antes de añadir otro.");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");

    setItems([
      ...items,
      {
        id: `temp-media-${Date.now()}`,
        type: "media",
        file: file,
        previewUrl: objectUrl,
        isVideo: isVideo,
        content: "", // Se mantiene vacío ya que no hay UI para editarlo
        isNew: true,
      },
    ]);
    e.target.value = null;
  };

  const updateItem = (index, newItem) => {
    const newItems = [...items];
    newItems[index] = newItem;
    setItems(newItems);
  };

  const removeItem = (index) => {
    const itemToRemove = items[index];
    if (!itemToRemove.isNew && itemToRemove.id) {
      setItemsToDelete([...itemsToDelete, itemToRemove.id]);
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Validar que no se guarden textos vacíos al final (opcional, limpieza)
    const validItems = items.filter(
      (item) => item.type === "media" || item.content?.trim()
    );

    if (validItems.length !== items.length) {
      // Opcional: Podrías limpiarlos automáticamente o avisar.
      // Aquí simplemente actualizamos el estado local para reflejar la limpieza antes de guardar.
      setItems(validItems);
    }

    setLoadingKey(typeKey);
    try {
      let parentId = data.id;

      if (!parentId) {
        const createRes = await fetch(buildStrapiUrl("/api/remarketings"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: {
              hotness_message: typeKey,
              chatbot: chatbotId,
              content: "Container",
            },
          }),
        });
        if (!createRes.ok) throw new Error("Error creando entidad padre");
        const createPayload = await createRes.json();
        parentId = createPayload.data.documentId || createPayload.data.id;
      }

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
      } catch {}

      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        let mediaId = item.mediaId;

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

        const payload = {
          content: item.content || "", // Aseguramos string vacío si es null
          order: i,
          remarketing: parentId,
          media: mediaId,
        };

        const existingIdAtOrder = existingByOrder[i];
        const targetId = !item.isNew ? (item.id || existingIdAtOrder) : null;

        console.log("targetId", targetId);

        if (targetId) {
          await fetch(
            buildStrapiUrl(`/api/remarketing-contents/${targetId}`),
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ data: payload }),
            }
          );
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

      for (const idToDelete of itemsToDelete) {
        await fetch(buildStrapiUrl(`/api/remarketing-contents/${idToDelete}`), {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setItemsToDelete([]);
      toast.success(`Guardado ${config.label}`);
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar");
    } finally {
      setLoadingKey(null);
    }
  };

  const isLoading = loadingKey === typeKey;
  const Icon = config.icon;

  return (
    <div
      className={`flex flex-col rounded-xl border p-4 ${config.areaClass} h-full`}
    >
      <div className="space-y-2 mb-4">
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${config.badgeClass}`}
        >
          <Icon className="h-4 w-4" />
          {config.label}
        </div>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>

      <div className="flex-1 flex flex-col gap-2 min-h-[100px]">
        {items.length === 0 && (
          <div className="text-center py-6 border border-dashed rounded bg-background/30 text-xs text-muted-foreground">
            No hay mensajes configurados.
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
      </div>

      <div className="mt-4 pt-4 border-t border-border/50 flex flex-col gap-3">
        <div className="flex gap-2">
          <Button
            onClick={addText}
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs bg-background/50"
          >
            <MessageSquare className="w-3 h-3 mr-2" /> Texto
          </Button>

          <div className="relative flex-1">
            <input
              type="file"
              id={`upload-${typeKey}`}
              className="hidden"
              accept="image/*,video/*"
              onChange={addMedia}
            />
            <Button
              onClick={() =>
                document.getElementById(`upload-${typeKey}`)?.click()
              }
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs bg-background/50"
            >
              <ImageIcon className="w-3 h-3 mr-2" /> Media
            </Button>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isLoading}
          variant="default"
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Guardar Cambios"
          )}
        </Button>
      </div>
    </div>
  );
}

// --- Componente Principal ---
export default function ReminderMessages({
  token,
  chatbotSlug,
  chatbotId,
  initialData = { hot: {}, normal: {}, cold: {} },
  initialInterval = "",
}) {
  const [loadingKey, setLoadingKey] = useState(null);

  // Interval Logic
  const [intervalUnit, setIntervalUnit] = useState(() => {
    const m = Number(initialInterval) || 0;
    return m > 0 && m % 60 === 0 ? "hours" : "minutes";
  });
  const [interval, setInterval] = useState(() => {
    const m = Number(initialInterval) || 0;
    return m > 0 && m % 60 === 0
      ? String(Math.floor(m / 60))
      : String(initialInterval || "");
  });

  const handleSaveInterval = async () => {
    setLoadingKey("interval");
    try {
      const valueNum = Number(interval) || 0;
      if (!valueNum || valueNum <= 0) {
        toast.error("Intervalo inválido");
        return;
      }
      const minutesToSave = intervalUnit === "hours" ? valueNum * 60 : valueNum;

      const res = await fetch(buildStrapiUrl(`/api/chatbots/${chatbotSlug}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: { cooldown_minutes: minutesToSave },
        }),
      });

      if (!res.ok) throw new Error("Falló guardado");
      toast.success("Intervalo actualizado");
    } catch (e) {
      toast.error("Error al guardar intervalo");
    } finally {
      setLoadingKey(null);
    }
  };

  const messageTypes = [
    {
      key: "hot",
      label: "Hot",
      description: "Seguimiento inmediato alta intención.",
      icon: Flame,
      badgeClass:
        "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100",
      areaClass:
        "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900",
    },
    {
      key: "normal",
      label: "Normal",
      description: "Mensajes para mantener conversación.",
      icon: Sparkles,
      badgeClass:
        "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100",
      areaClass:
        "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900",
    },
    {
      key: "cold",
      label: "Cold",
      description: "Reengancha contactos fríos.",
      icon: Snowflake,
      badgeClass:
        "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-100",
      areaClass:
        "bg-sky-50/70 dark:bg-sky-950/30 border-sky-200/60 dark:border-sky-900",
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-muted/40 p-4 md:flex-row md:items-center md:justify-between">
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
              className="w-full sm:w-40"
            />
            <Select value={intervalUnit} onValueChange={setIntervalUnit}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutos</SelectItem>
                <SelectItem value="hours">Horas</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Aplica globalmente. Máx 24h.
            </p>
          </div>
        </div>

        <Button
          variant={interval?.trim() ? "default" : "secondary"}
          disabled={loadingKey === "interval" || !interval?.trim()}
          onClick={handleSaveInterval}
        >
          {loadingKey === "interval" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
            </>
          ) : (
            "Guardar intervalo"
          )}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 items-start">
        {messageTypes.map((config) => (
          <RemarketingCard
            key={config.key}
            typeKey={config.key}
            config={config}
            data={initialData[config.key] || { items: [] }}
            chatbotId={chatbotId}
            token={token}
            loadingKey={loadingKey}
            setLoadingKey={setLoadingKey}
          />
        ))}
      </div>
    </div>
  );
}
