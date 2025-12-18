"use client";

import React from "react";
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
import {
  Trash2,
  FileVideo,
  FileText,
  GripVertical,
} from "lucide-react";

export function ContentItem({ item, index, onUpdate, onRemove, dragHandleProps }) {
  const isMedia = item.type === "media";
  const mime = String(item.mediaMime || (item.file && item.file.type) || "");
  const isVid = !!(item.isVideo || mime.startsWith("video"));
  const isImg = mime.startsWith("image");
  const rawFileName = (() => {
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
  const fileName = (() => {
    const name = String(rawFileName || "archivo");
    const max = 30;
    if (name.length <= max) return name;
    const dotIdx = name.lastIndexOf(".");
    const ext = dotIdx >= 0 ? name.slice(dotIdx) : "";
    const base = dotIdx >= 0 ? name.slice(0, dotIdx) : name;
    const ell = "...";
    const remain = max - (ell.length + ext.length);
    if (remain <= 0) return ell + ext;
    return base.slice(0, remain) + ell + ext;
  })();

  const hasContent = item.content?.trim() || item.file || item.mediaUrl;

  return (
    <div className="p-3 sm:p-4 bg-background/50 rounded-lg border mb-3 max-w-full overflow-hidden flex gap-2 items-start">
       <div
        {...dragHandleProps}
        className={`mt-2 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground ${!hasContent ? 'opacity-30 cursor-not-allowed' : ''}`}
        title={!hasContent ? "Completa el contenido para mover" : "Mover"}
      >
        <GripVertical className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_36px] gap-3 sm:gap-4 items-start sm:items-center min-w-0">
            <div className="flex flex-col gap-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-sm font-bold text-muted-foreground">
                Mensaje {index + 1}
                </span>
                <div className="flex flex-wrap gap-2 items-center">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Tiempo:</Label>
                <Input
                    type="number"
                    min="1"
                    placeholder="15"
                    className="w-16 sm:w-20 h-8 text-sm"
                    value={item.time_to_send || ""}
                    onChange={(e) =>
                    onUpdate({ ...item, time_to_send: e.target.value })
                    }
                />
                <Select
                    value={item.timeUnit || "minutes"}
                    onValueChange={(val) => onUpdate({ ...item, timeUnit: val })}
                >
                    <SelectTrigger className="w-24 sm:w-28 h-8 text-xs">
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
                    <div className="w-full rounded border p-3 flex items-center gap-2 min-w-0">
                    <FileText className="w-5 h-5 text-slate-500" />
                    <span className="text-xs truncate flex-1 min-w-0" title={rawFileName}>
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
            <div className="flex items-center justify-end sm:justify-center mt-2 sm:mt-0">
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
    </div>
  );
}
