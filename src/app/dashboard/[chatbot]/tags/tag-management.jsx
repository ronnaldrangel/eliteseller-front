"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { buildStrapiUrl } from "@/lib/strapi";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";

const MAX_DESCRIPTION_LENGTH = 100;
const DEFAULT_COLOR = "#2563eb";
const TAG_NAME_PATTERN = /^[a-z0-9-]+$/;

const sanitizeTagName = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const randomId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const isHexColor = (value) => /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value || "");

const normalizeTag = (entry) => {
  if (!entry) return null;

  const attributes = entry.attributes ?? entry;
  const documentId =
    entry.documentId ??
    attributes.documentId ??
    entry.id ??
    attributes.id ??
    randomId() ??
    attributes.name ??
    entry.name;

  return {
    id: String(documentId ?? attributes.name ?? entry.name ?? randomId()),
    documentId: documentId ? String(documentId) : null,
    name: attributes.name ?? entry.name ?? "",
    color: attributes.color ?? entry.color ?? DEFAULT_COLOR,
    description: attributes.description ?? entry.description ?? "",
  };
};

export default function TagManagement({
  initialTags = [],
  token,
  chatbotId,
  createOpen,
  onCreateOpenChange,
}) {
  const [tags, setTags] = useState(
    Array.isArray(initialTags)
      ? initialTags.map(normalizeTag).filter(Boolean)
      : []
  );
  const [form, setForm] = useState({
    name: "",
    color: DEFAULT_COLOR,
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ loading: false, error: null });
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    color: DEFAULT_COLOR,
    description: "",
  });
  const [editErrors, setEditErrors] = useState({});
  const [editStatus, setEditStatus] = useState({ loading: false, error: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!Array.isArray(initialTags)) return;
    setTags(initialTags.map(normalizeTag).filter(Boolean));
  }, [initialTags]);

  const colorPreview = useMemo(() => {
    const candidate = form.color?.trim();
    if (isHexColor(candidate)) {
      return candidate;
    }
    return DEFAULT_COLOR;
  }, [form.color]);

  const editColorPreview = useMemo(() => {
    const candidate = editForm.color?.trim();
    if (isHexColor(candidate)) {
      return candidate;
    }
    return DEFAULT_COLOR;
  }, [editForm.color]);

  const validate = (fields) => {
    const nextErrors = {};

    if (!fields.name?.trim()) {
      nextErrors.name = "El nombre de la etiqueta es obligatorio.";
    }

    if (fields.name && !TAG_NAME_PATTERN.test(fields.name.trim())) {
      nextErrors.name = "Solo numeros, minusculas y guiones (-), sin espacios.";
    }

    if (fields.color && !isHexColor(fields.color.trim())) {
      nextErrors.color = "Usa un color en formato hexadecimal (ej. #2563eb).";
    }

    if ((fields.description || "").length > MAX_DESCRIPTION_LENGTH) {
      nextErrors.description = `Maximo ${MAX_DESCRIPTION_LENGTH} caracteres permitidos.`;
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validation = validate(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      setStatus({
        loading: false,
        error: "Revisa los campos marcados antes de guardar la etiqueta.",
      });
      return;
    }

    setErrors({});
    setStatus({ loading: true, error: null });

    try {
      const payload = {
        data: {
          name: form.name.trim(),
          color: form.color?.trim() || DEFAULT_COLOR,
          description: form.description?.trim() || "",
        },
      };

      if (chatbotId) {
        payload.data.chatbot = { connect: [{ documentId: chatbotId }] };
      }

      const response = await fetch(buildStrapiUrl(`/api/tags`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          body?.error?.message ||
          "No se pudo crear la etiqueta. Intenta nuevamente.";
        setStatus({ loading: false, error: message });
        return;
      }

      const normalized = normalizeTag(body?.data ?? body);
      if (normalized) {
        setTags((previous) => [normalized, ...previous]);
      }

      toast.success("Etiqueta creada correctamente.");
      setForm({ name: "", color: DEFAULT_COLOR, description: "" });
      setStatus({ loading: false, error: null });
      onCreateOpenChange(false);
    } catch (error) {
      setStatus({
        loading: false,
        error: "Error de red al crear la etiqueta.",
      });
    }
  };

  const openEdit = (tag) => {
    const normalized = normalizeTag(tag);
    setEditTarget(normalized);
    setEditForm({
      name: normalized?.name || "",
      color: normalized?.color || DEFAULT_COLOR,
      description: normalized?.description || "",
    });
    setEditErrors({});
    setEditStatus({ loading: false, error: null });
    setEditOpen(true);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editTarget) return;

    const validation = validate(editForm);
    if (Object.keys(validation).length > 0) {
      setEditErrors(validation);
      setEditStatus({
        loading: false,
        error: "Revisa los campos marcados antes de actualizar la etiqueta.",
      });
      return;
    }

    setEditErrors({});
    setEditStatus({ loading: true, error: null });

    try {
      const docId = editTarget.documentId || editTarget.id;
      const response = await fetch(
        buildStrapiUrl(`/api/tags/${encodeURIComponent(docId)}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            data: {
              name: editForm.name.trim(),
              color: editForm.color?.trim() || DEFAULT_COLOR,
              description: editForm.description?.trim() || "",
            },
          }),
        }
      );

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          body?.error?.message ||
          "No se pudo actualizar la etiqueta. Intenta nuevamente.";
        setEditStatus({ loading: false, error: message });
        return;
      }

      const updated = normalizeTag(body?.data ?? body);
      const docIdStr = String(editTarget.documentId || editTarget.id);
      setTags((previous) =>
        previous.map((t) =>
          String(t.documentId || t.id) === docIdStr
            ? {
                ...t,
                name: updated.name,
                color: updated.color,
                description: updated.description,
              }
            : t
        )
      );

      toast.success("Etiqueta actualizada correctamente.");
      setEditStatus({ loading: false, error: null });
      setEditOpen(false);
      setEditTarget(null);
    } catch (error) {
      setEditStatus({
        loading: false,
        error: "Error de red al actualizar la etiqueta.",
      });
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleteStatus({ loading: true, error: null });
    try {
      const docId = toDelete.documentId || toDelete.id;
      const res = await fetch(
        buildStrapiUrl(`/api/tags/${encodeURIComponent(docId)}`),
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteStatus({
          loading: false,
          error: body?.error?.message || "No se pudo eliminar la etiqueta.",
        });
        return;
      }
      setTags((prev) =>
        prev.filter((t) => String(t.documentId || t.id) !== String(docId))
      );
      toast.success("Etiqueta eliminada correctamente.");
      setDeleteStatus({ loading: false, error: null });
      setToDelete(null);
    } catch (e) {
      setDeleteStatus({
        loading: false,
        error: "Error de red al eliminar la etiqueta.",
      });
    }
  };

  return (
    <>
      {/* Modal de creacion - controlado desde el padre */}
      <Dialog open={createOpen} onOpenChange={onCreateOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva etiqueta</DialogTitle>
            {/* <DialogDescription>
              Clasifica tus conversaciones y productos con etiquetas
              personalizadas.
            </DialogDescription> */}
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <FieldSet>
              <FieldGroup className="gap-6">
                <Field data-invalid={errors.name ? true : undefined}>
                  <FieldLabel htmlFor="tag-name">Nombre</FieldLabel>
                  <FieldContent>
                    <Input
                      id="tag-name"
                      placeholder="Ej. cliente-vip"
                      value={form.name}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          name: sanitizeTagName(event.target.value),
                        }))
                      }
                      pattern="[a-z0-9-]+"
                      title="Usa solo numeros, minusculas y guiones (-), sin espacios"
                      inputMode="text"
                    />
                    <FieldDescription>
                      Usa solo numeros, minusculas y guiones (-), sin espacios.
                    </FieldDescription>
                    <FieldError>{errors.name}</FieldError>
                  </FieldContent>
                </Field>

                <Field data-invalid={errors.color ? true : undefined}>
                  <FieldLabel htmlFor="tag-color">Color</FieldLabel>
                  <FieldContent>
                    <div className="flex items-center gap-3">
                      <Input
                        id="tag-color"
                        value={form.color}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            color: event.target.value,
                          }))
                        }
                        placeholder="#2563eb"
                        className="font-mono"
                      />
                      <input
                        type="color"
                        aria-label="Seleccionar color"
                        value={colorPreview}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            color: event.target.value,
                          }))
                        }
                        className="h-10 w-12 cursor-pointer rounded-md border border-muted-foreground/30 bg-background p-1"
                      />
                    </div>
                    <FieldDescription>
                      Elige un color que facilite la identificacion visual en
                      listas.
                    </FieldDescription>
                    <FieldError>{errors.color}</FieldError>
                  </FieldContent>
                </Field>
              </FieldGroup>

              <Field data-invalid={errors.description ? true : undefined}>
                <FieldLabel htmlFor="tag-description">Descripcion</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="tag-description"
                    rows={3}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    placeholder="Describe en que casos usaras esta etiqueta."
                    value={form.description}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        description: event.target.value,
                      }))
                    }
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <FieldDescription className="text-xs">
                      Maximo {MAX_DESCRIPTION_LENGTH} caracteres.
                    </FieldDescription>
                    <span>
                      {form.description.length}/{MAX_DESCRIPTION_LENGTH}
                    </span>
                  </div>
                  <FieldError>{errors.description}</FieldError>
                </FieldContent>
              </Field>
            </FieldSet>

            {status.error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {status.error}
              </div>
            )}

            <DialogFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={status.loading || !token || !chatbotId}
              >
                {status.loading ? "Guardando..." : "Crear etiqueta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 pb-6">
        {/* El overflow aquí es para el responsive */}
        <Card className="bg-background/80 overflow-x-auto">
          <CardContent>
            {/* <div className="overflow-x-auto"> */}
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">
                      Nombre
                    </TableHead>
                    <TableHead className="min-w-[360px]">Descripcion</TableHead>
                    <TableHead className="min-w-[140px]">
                      Color
                    </TableHead>
                    <TableHead className="min-w-[180px]">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-20 text-center text-muted-foreground"
                      >
                        Aun no tienes etiquetas. Crea la primera para organizar
                        tus contactos y ventas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell>
                          <Badge
                            style={{
                              backgroundColor: tag.color,
                              color: "#ffffff",
                              borderColor: tag.color,
                            }}
                            className="font-medium text-foreground"
                          >
                            {tag.name || "Sin nombre"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tag.description ? (
                            <div
                              className="truncate max-w-xs"
                              title={tag.description}
                            >
                              {tag.description}
                            </div>
                          ) : (
                            <span className="text-xs">
                              Sin descripcion asignada.
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            aria-hidden
                            className="size-6 rounded-full border border-muted-foreground/20 inline-block align-middle"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            {tag.color}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(tag)}
                              disabled={!token || !chatbotId}
                            >
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => setToDelete(tag)}
                              disabled={!token || !chatbotId}
                              aria-label="Eliminar etiqueta"
                              title="Eliminar etiqueta"
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {tags.length > 0 && (
                  <TableCaption className="text-xs">
                    Las etiquetas se sincronizan automaticamente con tu chatbot.
                  </TableCaption>
                )}
              </Table>
            {/* </div> */}
          </CardContent>
        </Card>

        {/* Modal de edicion */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar etiqueta</DialogTitle>
              <DialogDescription>
                Actualiza el nombre, color y descripcion de la etiqueta
                seleccionada.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-6">
              <FieldSet>
                <FieldGroup className="gap-6">
                  <Field data-invalid={editErrors.name ? true : undefined}>
                    <FieldLabel htmlFor="edit-tag-name">Nombre</FieldLabel>
                    <FieldContent>
                      <Input
                        id="edit-tag-name"
                        placeholder="Ej. cliente-vip"
                        value={editForm.name}
                        onChange={(event) =>
                          setEditForm((previous) => ({
                            ...previous,
                            name: sanitizeTagName(event.target.value),
                          }))
                        }
                        pattern="[a-z0-9-]+"
                        title="Usa solo numeros, minusculas y guiones (-), sin espacios"
                        inputMode="text"
                      />
                      <FieldDescription>
                        Usa solo numeros, minusculas y guiones (-), sin
                        espacios.
                      </FieldDescription>
                      <FieldError>{editErrors.name}</FieldError>
                    </FieldContent>
                  </Field>

                  <Field data-invalid={editErrors.color ? true : undefined}>
                    <FieldLabel htmlFor="edit-tag-color">Color</FieldLabel>
                    <FieldContent>
                      <div className="flex items-center gap-3">
                        <Input
                          id="edit-tag-color"
                          value={editForm.color}
                          onChange={(event) =>
                            setEditForm((previous) => ({
                              ...previous,
                              color: event.target.value,
                            }))
                          }
                          placeholder="#2563eb"
                          className="font-mono"
                        />
                        <input
                          type="color"
                          aria-label="Seleccionar color"
                          value={editColorPreview}
                          onChange={(event) =>
                            setEditForm((previous) => ({
                              ...previous,
                              color: event.target.value,
                            }))
                          }
                          className="h-10 w-12 cursor-pointer rounded-md border border-muted-foreground/30 bg-background p-1"
                        />
                      </div>
                      <FieldDescription>
                        Elige un color que facilite la identificacion visual en
                        listas.
                      </FieldDescription>
                      <FieldError>{editErrors.color}</FieldError>
                    </FieldContent>
                  </Field>
                </FieldGroup>

                <Field data-invalid={editErrors.description ? true : undefined}>
                  <FieldLabel htmlFor="edit-tag-description">
                    Descripcion
                  </FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="edit-tag-description"
                      rows={3}
                      maxLength={MAX_DESCRIPTION_LENGTH}
                      placeholder="Describe en que casos usaras esta etiqueta."
                      value={editForm.description}
                      onChange={(event) =>
                        setEditForm((previous) => ({
                          ...previous,
                          description: event.target.value,
                        }))
                      }
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <FieldDescription className="text-xs">
                        Opcional. Maximo {MAX_DESCRIPTION_LENGTH} caracteres.
                      </FieldDescription>
                      <span>
                        {editForm.description.length}/{MAX_DESCRIPTION_LENGTH}
                      </span>
                    </div>
                    <FieldError>{editErrors.description}</FieldError>
                  </FieldContent>
                </Field>
              </FieldSet>

              {editStatus.error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {editStatus.error}
                </div>
              )}

              <DialogFooter>
                <div className="text-xs text-muted-foreground md:text-sm mr-auto">
                  Las etiquetas se sincronizan automaticamente con tu chatbot.
                </div>
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={editStatus.loading || !token || !chatbotId}
                >
                  {editStatus.loading ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Confirmacion de borrado */}
        <AlertDialog
          open={!!toDelete}
          onOpenChange={(open) => (open ? null : setToDelete(null))}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar etiqueta</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                ¿Seguro que deseas eliminar la etiqueta{" "}
                <span className="font-medium">"{toDelete?.name}"</span>? Esta
                accion no se puede deshacer.
              </p>
              {deleteStatus.error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {deleteStatus.error}
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setToDelete(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteStatus.loading || !token || !chatbotId}
              >
                {deleteStatus.loading ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
