"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  MessageSquare,
  ImageIcon,
  Trash2,
  GripVertical,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableReminderContentItem } from "./sortable-reminder-content-item";

export function ReminderGroup({ group, index, onUpdate, onRemove, dragHandleProps }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = group.items.findIndex((item) => item.id === active.id);
      const newIndex = group.items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(group.items, oldIndex, newIndex);
      onUpdate({ ...group, items: newItems });
    }
  };

  const addText = () => {
    const lastItem = group.items[group.items.length - 1];
    if (lastItem && lastItem.type === "text" && !lastItem.content?.trim()) {
      toast.warning("Completa el mensaje vacío antes de añadir otro.");
      return;
    }

    const nextItems = [
      ...group.items,
      {
        id: `temp-txt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "text",
        content: "",
        isNew: true,
      },
    ];
    onUpdate({ ...group, items: nextItems });
  };

  const addMedia = (e) => {
    const lastItem = group.items[group.items.length - 1];
    if (lastItem && lastItem.type === "text" && !lastItem.content?.trim()) {
      toast.warning("Completa el mensaje vacío antes de añadir otro.");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");

    const nextItems = [
      ...group.items,
      {
        id: `temp-media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "media",
        file: file,
        previewUrl: objectUrl,
        isVideo: isVideo,
        content: "",
        isNew: true,
      },
    ];
    onUpdate({ ...group, items: nextItems });
    e.target.value = null;
  };

  const updateItem = (itemIndex, newItem) => {
    const newItems = [...group.items];
    newItems[itemIndex] = newItem;
    onUpdate({ ...group, items: newItems });
  };

  const removeItem = (itemIndex) => {
    const itemToRemove = group.items[itemIndex];
    // Logic to track deleted items should be handled by parent or here if we want to track deletions within group
    // For now, we just remove from the list. The parent saving logic will handle diffing or we can pass a separate "itemsToDelete" list up.
    // But wait, the original code tracked deletions.
    // We should probably add a `itemsToDelete` property to the group or handle it in the parent.
    // To keep it simple, let's assume the parent handles the "save" logic by comparing with initial state or we pass deleted IDs up.
    // Actually, the `ReminderForm` in original code had `itemsToDelete` state.
    // Here `ReminderGroup` is a controlled component.
    // We can add `deletedItems` to the group object? Or just let the parent handle it?
    // Let's add a `deletedItems` array to the group object if it doesn't exist, or update it.
    
    let newDeletedItems = group.deletedItems || [];
    if (!itemToRemove.isNew && (itemToRemove.id || itemToRemove.documentId)) {
        newDeletedItems = [...newDeletedItems, { id: itemToRemove.id, documentId: itemToRemove.documentId }];
    }

    const newItems = group.items.filter((_, i) => i !== itemIndex);
    onUpdate({ ...group, items: newItems, deletedItems: newDeletedItems });
  };

  return (
    <div className="border rounded-xl p-4 bg-card text-card-foreground shadow-sm space-y-4">
      <div className="max-w-full space-y-2">
        <div className="flex items-center justify-between gap-4 border-b pb-3">
            <div className="flex items-center gap-2">
                <div
                    {...dragHandleProps}
                    className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground"
                    title="Mover grupo"
                >
                    <GripVertical className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    Grupo {index + 1}
                </h3>
            </div>
        
            
        </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-md">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {/* <Label className="text-xs text-muted-foreground whitespace-nowrap">Enviar después de:</Label> */}
                <Input
                    type="number"
                    min="1"
                    placeholder="15"
                    className="w-16 h-7 text-xs bg-background"
                    value={group.time_to_send || ""}
                    onChange={(e) =>
                        onUpdate({ ...group, time_to_send: e.target.value })
                    }
                />
                <Select
                    value={group.timeUnit || "minutes"}
                    onValueChange={(val) => onUpdate({ ...group, timeUnit: val })}
                >
                    <SelectTrigger className="w-24 h-7 text-xs bg-background">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="minutes">Minutos</SelectItem>
                        <SelectItem value="hours">Horas</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={onRemove}
                title="Eliminar grupo"
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
      </div>
      

      <div className="space-y-3">
        {group.items.length === 0 && (
          <div className="text-center py-6 border border-dashed rounded-lg bg-muted/20 text-xs text-muted-foreground">
            Este grupo no tiene mensajes. Añade uno.
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          id={`dnd-context-${group.id}`} 
        >
          <SortableContext
            items={group.items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {group.items.map((item, idx) => (
              <SortableReminderContentItem
                key={item.id}
                item={item}
                index={idx}
                onUpdate={(updated) => updateItem(idx, updated)}
                onRemove={() => removeItem(idx)}
              />
            ))}
          </SortableContext>
        </DndContext>

        <div className="flex flex-row flex-wrap gap-2 pt-2 w-full min-w-0">
          <Button
            onClick={addText}
            variant="outline"
            size="sm"
            className="flex-1 w-full text-xs"
          >
            <MessageSquare className="w-4 h-4 mr-2" /> Añadir mensaje
          </Button>

          <div className="relative flex-1 w-full">
            <input
              type="file"
              id={`upload-group-${group.id}`}
              className="hidden"
              accept="image/*,video/*"
              onChange={addMedia}
            />
            <Button
              onClick={() =>
                document.getElementById(`upload-group-${group.id}`)?.click()
              }
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              <ImageIcon className="w-4 h-4 mr-2" /> Añadir multimedia
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
