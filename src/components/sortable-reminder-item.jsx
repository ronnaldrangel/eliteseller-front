"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ContentItem } from "./reminder-content-item";

export function SortableReminderItem({ item, index, onUpdate, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
    zIndex: isDragging ? 999 : "auto",
  };

  const hasContent = item.content?.trim() || item.file || item.mediaUrl;
  
  // Only pass listeners if hasContent is true
  const dragHandleProps = hasContent ? { ...attributes, ...listeners } : {};

  return (
    <div ref={setNodeRef} style={style}>
      <ContentItem
        item={item}
        index={index}
        onUpdate={onUpdate}
        onRemove={onRemove}
        dragHandleProps={dragHandleProps}
      />
    </div>
  );
}
