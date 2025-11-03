"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { buildStrapiUrl } from "@/lib/strapi"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

const MAX_DESCRIPTION_LENGTH = 240
const DEFAULT_COLOR = "#2563eb"

const randomId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const isHexColor = (value) => /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value || "")

const normalizeTag = (entry) => {
  if (!entry) return null

  const attributes = entry.attributes ?? entry
  const documentId =
    entry.documentId ??
    attributes.documentId ??
    entry.id ??
    attributes.id ??
    randomId() ??
    attributes.name ??
    entry.name

  return {
    id: String(documentId ?? attributes.name ?? entry.name ?? randomId()),
    documentId: documentId ? String(documentId) : null,
    name: attributes.name ?? entry.name ?? "",
    color: attributes.color ?? entry.color ?? DEFAULT_COLOR,
    description: attributes.description ?? entry.description ?? "",
  }
}

export default function TagManagement({
  initialTags = [],
  token,
  chatbotId,
}) {
  const [tags, setTags] = useState(
    Array.isArray(initialTags)
      ? initialTags.map(normalizeTag).filter(Boolean)
      : []
  )
  const [form, setForm] = useState({
    name: "",
    color: DEFAULT_COLOR,
    description: "",
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ loading: false, error: null })

  useEffect(() => {
    if (!Array.isArray(initialTags)) return
    setTags(initialTags.map(normalizeTag).filter(Boolean))
  }, [initialTags])

  const colorPreview = useMemo(() => {
    const candidate = form.color?.trim()
    if (isHexColor(candidate)) {
      return candidate
    }
    return DEFAULT_COLOR
  }, [form.color])

  const validate = () => {
    const nextErrors = {}

    if (!form.name.trim()) {
      nextErrors.name = "El nombre de la etiqueta es obligatorio."
    }

    if (form.color && !isHexColor(form.color.trim())) {
      nextErrors.color = "Usa un color en formato hexadecimal (ej. #2563eb)."
    }

    if (form.description.length > MAX_DESCRIPTION_LENGTH) {
      nextErrors.description = `Maximo ${MAX_DESCRIPTION_LENGTH} caracteres permitidos.`
    }

    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validation = validate()
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      setStatus({
        loading: false,
        error: "Revisa los campos marcados antes de guardar la etiqueta.",
      })
      return
    }

    setErrors({})
    setStatus({ loading: true, error: null })

    try {
      const payload = {
        data: {
          name: form.name.trim(),
          color: form.color?.trim() || DEFAULT_COLOR,
          description: form.description?.trim() || "",
        },
      }

      if (chatbotId) {
        payload.data.chatbot = { connect: [{ documentId: chatbotId }] }
      }

      const response = await fetch(buildStrapiUrl(`/api/tags`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message =
          body?.error?.message ||
          "No se pudo crear la etiqueta. Intenta nuevamente."
        setStatus({ loading: false, error: message })
        return
      }

      const normalized = normalizeTag(body?.data ?? body)
      if (normalized) {
        setTags((previous) => [normalized, ...previous])
      }

      toast.success("Etiqueta creada correctamente.")
      setForm({ name: "", color: DEFAULT_COLOR, description: "" })
      setStatus({ loading: false, error: null })
    } catch (error) {
      setStatus({
        loading: false,
        error: "Error de red al crear la etiqueta.",
      })
    }
  }

  return (
    <div className="grid gap-6 pb-6">
      <Card className="border-dashed border-muted-foreground/20 bg-muted/10">
        <CardHeader className="gap-1">
          <CardTitle className="text-xl">Nueva etiqueta</CardTitle>
          <CardDescription>
            Clasifica tus conversaciones y productos con etiquetas personalizadas.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="contents">
          <CardContent className="space-y-6">
            <FieldSet>
              <FieldGroup className="gap-6">
                <Field data-invalid={errors.name ? true : undefined}>
                  <FieldLabel htmlFor="tag-name">Nombre</FieldLabel>
                  <FieldContent>
                    <Input
                      id="tag-name"
                      placeholder="Ej. Cliente VIP"
                      value={form.name}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          name: event.target.value,
                        }))
                      }
                    />
                    <FieldDescription>
                      Usa un nombre breve y facil de identificar.
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
                      Elige un color que facilite la identificacion visual en listas.
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
                      Opcional. Maximo {MAX_DESCRIPTION_LENGTH} caracteres.
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
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t border-dashed border-muted-foreground/20 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-muted-foreground md:text-sm">
              Las etiquetas se sincronizan automaticamente con tu chatbot.
            </div>
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={status.loading || !token || !chatbotId}
            >
              {status.loading ? "Guardando..." : "Crear etiqueta"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="bg-background/80">
        <CardHeader className="gap-1">
          <CardTitle className="text-lg">Etiquetas registradas</CardTitle>
          <CardDescription>
            Visualiza las etiquetas disponibles y como se presentaran en la interfaz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
              Aun no tienes etiquetas. Crea la primera para organizar tus contactos y ventas.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="rounded-lg border border-muted-foreground/20 bg-muted/10 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
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
                    <span
                      aria-hidden
                      className="size-8 rounded-full border border-muted-foreground/20"
                      style={{ backgroundColor: tag.color }}
                    />
                  </div>
                  {tag.description ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {tag.description}
                    </p>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Sin descripcion asignada.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
