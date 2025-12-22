"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  FileVideo,
  FileText,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReminderContentItem({ item, index, onUpdate, onRemove, dragHandleProps }) {
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
        <div className="grid grid-cols-1 gap-3 sm:gap-4 items-start min-w-0">
            <div className="flex flex-col gap-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-sm font-bold text-muted-foreground">
                Mensaje {index + 1}
                </span>
            </div>
            <div>
                {isMedia ? (
                isVid ? (
                    item.previewUrl || item.mediaUrl ? (
                    <div className="relative rounded-md overflow-hidden bg-black/10 aspect-video max-h-[200px] flex items-center justify-center">
                        <video
                        src={item.previewUrl || item.mediaUrl}
                        controls
                        className="w-full h-full object-contain"
                        />
                    </div>
                    ) : (
                    <div className="flex items-center justify-center h-32 bg-muted rounded-md text-muted-foreground text-xs">
                        <FileVideo className="w-8 h-8 mb-2 opacity-50" />
                        Sin vista previa
                    </div>
                    )
                ) : (
                    item.previewUrl || item.mediaUrl ? (
                    <div className="relative rounded-md overflow-hidden bg-black/5 aspect-video max-h-[200px] flex items-center justify-center">
                        <img
                        src={item.previewUrl || item.mediaUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        />
                    </div>
                    ) : (
                    <div className="flex items-center justify-center h-32 bg-muted rounded-md text-muted-foreground text-xs">
                        <FileText className="w-8 h-8 mb-2 opacity-50" />
                        Sin vista previa
                    </div>
                    )
                )
                ) : (
                <Textarea
                    placeholder="Escribe el mensaje aquí..."
                    value={item.content || ""}
                    onChange={(e) => onUpdate({ ...item, content: e.target.value })}
                    className="min-h-[80px] text-sm"
                />
                )}
            </div>

            {isMedia && (
                <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded border">
                    {isVid ? <FileVideo className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    <span className="truncate max-w-[200px]" title={rawFileName}>
                    {fileName}
                    </span>
                </div>
                </div>
            )}
            </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive h-8 w-8"
        onClick={onRemove}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
