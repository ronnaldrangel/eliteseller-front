"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { buildStrapiUrl } from "@/lib/strapi";
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
import { SortableReminderGroup } from "./sortable-reminder-group";

export function ReminderSection({
  typeKey,
  config,
  data, // Initial data for this section (Remarketing entity with groups)
  chatbotId,
  token,
  onSaveSuccess,
}) {
  const [groups, setGroups] = useState([]);
  const [groupsToDelete, setGroupsToDelete] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize groups from data
  useEffect(() => {
    if (data && data.remarketing_groups) {
      const sortedGroups = [...data.remarketing_groups].sort((a, b) => (a.order || 0) - (b.order || 0));
      const processedGroups = sortedGroups.map(g => {
        const minutes = Number(g.time_to_send) || 0;
        const isHours = minutes > 0 && minutes % 60 === 0;
        
        const sortedItems = g.remarketing_contents ? [...g.remarketing_contents].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
        
        return {
          ...g,
          id: g.id || g.documentId, // Ensure we have an ID for DnD
          documentId: g.documentId || g.id,
          timeUnit: isHours ? "hours" : "minutes",
          time_to_send: isHours ? String(minutes / 60) : String(minutes),
          items: sortedItems.map(item => ({
            ...item,
            id: item.id || item.documentId,
            documentId: item.documentId || item.id,
            isNew: false
          })),
          deletedItems: [],
          isNew: false
        };
      });
      setGroups(processedGroups);
    } else {
        setGroups([]);
    }
  }, [data]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = groups.findIndex((g) => g.id === active.id);
      const newIndex = groups.findIndex((g) => g.id === over.id);

      setGroups(arrayMove(groups, oldIndex, newIndex));
    }
  };

  const addGroup = () => {
    const newGroup = {
      id: `temp-group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      time_to_send: "15",
      timeUnit: "minutes",
      items: [],
      deletedItems: [],
      isNew: true,
    };
    setGroups([...groups, newGroup]);
  };

  const updateGroup = (index, updatedGroup) => {
    const newGroups = [...groups];
    newGroups[index] = updatedGroup;
    setGroups(newGroups);
  };

  const removeGroup = (index) => {
    const groupToRemove = groups[index];
    if (!groupToRemove.isNew) {
      setGroupsToDelete([...groupsToDelete, { id: groupToRemove.id, documentId: groupToRemove.documentId }]);
    }
    const newGroups = groups.filter((_, i) => i !== index);
    setGroups(newGroups);
  };

  const handleSave = async () => {
    // Validation
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (!group.time_to_send || Number(group.time_to_send) <= 0) {
        toast.error(`El grupo ${i + 1} necesita un tiempo válido`);
        return;
      }
      if (group.items.length === 0) {
        toast.error(`El grupo ${i + 1} no tiene mensajes`);
        return;
      }
      for (let j = 0; j < group.items.length; j++) {
        const item = group.items[j];
        if (item.type === "text" && !item.content?.trim()) {
            toast.error(`El mensaje ${j + 1} del grupo ${i + 1} no puede estar vacío`);
            return;
        }
      }
    }

    setIsSaving(true);
    try {
      // 1. Ensure Parent Remarketing Exists
      let parentId = data.id || data.documentId;
      
      if (!parentId) {
        // Check if it was passed in data but maybe we need to create it?
        // The parent component usually passes the remarketing object if it exists.
        // If not, we create it.
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
        parentId = createPayload.data.id || createPayload.data.documentId;
      }

      // 2. Process Groups
      const savedGroups = [];
      
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        
        // Calculate time in minutes
        const timeValue = Number(group.time_to_send) || 0;
        const timeInMinutes = group.timeUnit === "hours" ? timeValue * 60 : timeValue;

        const groupPayload = {
            order: i,
            time_to_send: timeInMinutes,
            remarketing: parentId
        };

        let savedGroupId = !group.isNew ? (group.documentId || group.id) : null;
        let savedGroupDocId = group.documentId || group.id;

        // Create or Update Group
        if (savedGroupId) {
             const res = await fetch(buildStrapiUrl(`/api/remarketing-groups/${savedGroupId}`), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ data: groupPayload }),
            });
            if (!res.ok) throw new Error("Error actualizando grupo");
            const resJson = await res.json();
            savedGroupId = resJson.data.id || savedGroupId;
            savedGroupDocId = resJson.data.documentId || resJson.data.id;
        } else {
            const res = await fetch(buildStrapiUrl("/api/remarketing-groups"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ data: groupPayload }),
            });
            if (!res.ok) throw new Error("Error creando grupo");
            const resJson = await res.json();
            savedGroupId = resJson.data.id;
            savedGroupDocId = resJson.data.documentId || resJson.data.id;
        }

        // 3. Process Items within Group
        const savedItems = [];
        for (let j = 0; j < group.items.length; j++) {
            const item = group.items[j];
            let mediaId = item.mediaId || item.mediaDocumentId;
            let mediaUrl = item.mediaUrl;

            // Upload media if needed
            if (item.isNew && item.type === "media" && item.file) {
                const formData = new FormData();
                formData.append("files", item.file);

                const uploadRes = await fetch(buildStrapiUrl("/api/upload"), {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });

                if (!uploadRes.ok) throw new Error("Error subiendo multimedia");
                const uploadData = await uploadRes.json();
                mediaId = uploadData?.[0]?.id;
                mediaUrl = uploadData?.[0]?.url;
            }

            const itemPayload = {
                content: item.content || "",
                order: j,
                remarketing_group: savedGroupDocId, // Link to group
                media: mediaId ?? null,
            };

            let savedItemId = !item.isNew ? (item.documentId || item.id) : null;
            let savedItemDocId = item.documentId || item.id;

            if (savedItemId) {
                const res = await fetch(buildStrapiUrl(`/api/remarketing-contents/${savedItemId}`), {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ data: itemPayload }),
                });
                if (!res.ok) throw new Error("Error actualizando mensaje");
                const resJson = await res.json();
                savedItemId = resJson.data.id || savedItemId;
                savedItemDocId = resJson.data.documentId || resJson.data.id;
            } else {
                const res = await fetch(buildStrapiUrl("/api/remarketing-contents"), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ data: itemPayload }),
                });
                if (!res.ok) throw new Error("Error creando mensaje");
                const resJson = await res.json();
                savedItemId = resJson.data.id;
                savedItemDocId = resJson.data.documentId || resJson.data.id;
            }

            savedItems.push({
                ...item,
                id: savedItemId,
                documentId: savedItemDocId,
                mediaId: mediaId,
                mediaUrl: mediaUrl,
                isNew: false,
                file: undefined
            });
        }

        // Delete removed items within group
        if (group.deletedItems && group.deletedItems.length > 0) {
            for (const delItem of group.deletedItems) {
                const idToDelete = delItem.documentId || delItem.id;
                if (idToDelete) {
                    await fetch(buildStrapiUrl(`/api/remarketing-contents/${idToDelete}`), {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                }
            }
        }

        savedGroups.push({
            ...group,
            id: savedGroupId,
            documentId: savedGroupDocId,
            items: savedItems,
            deletedItems: [],
            isNew: false
        });
      }

      // 4. Delete removed Groups
      for (const delGroup of groupsToDelete) {
        const idToDelete = delGroup.documentId || delGroup.id;
        if (idToDelete) {
             // First delete contents of the group? Strapi might handle cascade delete if configured, but safer to delete contents first or rely on cascade.
             // Assuming cascade delete or that we don't care about orphaned contents for now (or Strapi cleans them up).
             // Actually, if we delete the group, we should probably delete the contents too if not cascaded.
             // But let's just delete the group for now.
             await fetch(buildStrapiUrl(`/api/remarketing-groups/${idToDelete}`), {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
        }
      }

      setGroups(savedGroups);
      setGroupsToDelete([]);
      toast.success(`Guardado exitosamente en ${config.label}`);
      if (onSaveSuccess) onSaveSuccess(typeKey, savedGroups);

    } catch (error) {
      console.error(error);
      toast.error("Error al guardar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const Icon = config.icon;
  const groupCount = groups.length;

  return (
    <div className={`flex flex-col rounded-xl border p-4 sm:p-6 ${config.areaClass} h-full max-w-full overflow-hidden`}>
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${config.badgeClass}`}>
            <Icon className="h-4 w-4" />
            {config.label}
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {config.description}
        </p>
        <p className="text-sm text-muted-foreground">
            {groupCount} {groupCount === 1 ? "grupo" : "grupos"} configurado{groupCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="space-y-4 py-4">
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            id={`dnd-context-section-${typeKey}`}
        >
            <SortableContext
                items={groups.map((g) => g.id)}
                strategy={verticalListSortingStrategy}
            >
                {groups.map((group, idx) => (
                    <SortableReminderGroup
                        key={group.id}
                        group={group}
                        index={idx}
                        onUpdate={(updated) => updateGroup(idx, updated)}
                        onRemove={() => removeGroup(idx)}
                    />
                ))}
            </SortableContext>
        </DndContext>

        <Button
            onClick={addGroup}
            variant="outline"
            className="w-full border-dashed"
        >
            <Plus className="w-4 h-4 mr-2" /> Añadir Grupo de Mensajes
        </Button>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t mt-auto">
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
