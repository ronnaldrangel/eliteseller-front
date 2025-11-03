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
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TRIGGER_EVENTS = [
  { value: "message_received", label: "Mensaje recibido" },
  { value: "order_created", label: "Pedido creado" },
  { value: "client_tagged", label: "Cliente etiquetado" },
  { value: "cart_abandoned", label: "Carrito abandonado" },
]

const MAX_CONDITION_LENGTH = 360
const MAX_RESPONSE_LENGTH = 500

const randomId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const normalizeTrigger = (entry) => {
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
    event: attributes.event ?? entry.event ?? "message_received",
    condition: attributes.condition ?? entry.condition ?? "",
    response: attributes.response ?? entry.response ?? "",
    active:
      attributes.active ??
      attributes.isActive ??
      entry.active ??
      entry.isActive ??
      true,
  }
}

export default function TriggerManagement({
  initialTriggers = [],
  token,
  chatbotId,
}) {
  const [triggers, setTriggers] = useState(
    Array.isArray(initialTriggers)
      ? initialTriggers.map(normalizeTrigger).filter(Boolean)
      : []
  )
  const [form, setForm] = useState({
    name: "",
    event: TRIGGER_EVENTS[0].value,
    condition: "",
    response: "",
    active: true,
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ loading: false, error: null })

  useEffect(() => {
    if (!Array.isArray(initialTriggers)) return
    setTriggers(initialTriggers.map(normalizeTrigger).filter(Boolean))
  }, [initialTriggers])

  const eventLabel = useMemo(() => {
    const found = TRIGGER_EVENTS.find((item) => item.value === form.event)
    return found?.label ?? "Mensaje recibido"
  }, [form.event])

  const validate = () => {
    const nextErrors = {}

    if (!form.name.trim()) {
      nextErrors.name = "Asigna un nombre para identificar el disparador."
    }

    if (!form.condition.trim()) {
      nextErrors.condition =
        "Describe cuando debe activarse este disparador."
    } else if (form.condition.length > MAX_CONDITION_LENGTH) {
      nextErrors.condition = `Maximo ${MAX_CONDITION_LENGTH} caracteres permitidos.`
    }

    if (!form.response.trim()) {
      nextErrors.response =
        "Especifica la accion o respuesta que se ejecutara."
    } else if (form.response.length > MAX_RESPONSE_LENGTH) {
      nextErrors.response = `Maximo ${MAX_RESPONSE_LENGTH} caracteres permitidos.`
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
        error: "Corregi los campos marcados para guardar el disparador.",
      })
      return
    }

    setErrors({})
    setStatus({ loading: true, error: null })

    try {
      const payload = {
        data: {
          name: form.name.trim(),
          event: form.event,
          condition: form.condition.trim(),
          response: form.response.trim(),
          active: Boolean(form.active),
        },
      }

      if (chatbotId) {
        payload.data.chatbot = { connect: [{ documentId: chatbotId }] }
      }

      const response = await fetch(buildStrapiUrl(`/api/triggers`), {
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
          "No se pudo crear el disparador. Intenta nuevamente."
        setStatus({ loading: false, error: message })
        return
      }

      const normalized = normalizeTrigger(body?.data ?? body)
      if (normalized) {
        setTriggers((previous) => [normalized, ...previous])
      }

      toast.success("Disparador creado correctamente.")
      setForm({
        name: "",
        event: TRIGGER_EVENTS[0].value,
        condition: "",
        response: "",
        active: true,
      })
      setStatus({ loading: false, error: null })
    } catch (error) {
      setStatus({
        loading: false,
        error: "Error de red al crear el disparador.",
      })
    }
  }

  return (
    <div className="grid gap-6 pb-6">
      <Card className="border-dashed border-muted-foreground/20 bg-muted/10">
        <CardHeader className="gap-1">
          <CardTitle className="text-xl">Nuevo disparador</CardTitle>
          <CardDescription>
            Automatiza tareas con disparadores basados en eventos y condiciones especificas.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="contents">
          <CardContent className="space-y-6">
            <FieldSet className="gap-6">
              <FieldGroup className="gap-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Field data-invalid={errors.name ? true : undefined}>
                    <FieldLabel htmlFor="trigger-name">Nombre</FieldLabel>
                    <FieldContent>
                      <Input
                        id="trigger-name"
                        placeholder="Ej. Envio bienvenida"
                        value={form.name}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            name: event.target.value,
                          }))
                        }
                      />
                      <FieldDescription>
                        Sera visible dentro del panel para identificar el disparador.
                      </FieldDescription>
                      <FieldError>{errors.name}</FieldError>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="trigger-event">Evento</FieldLabel>
                    <FieldContent>
                      <Select
                        value={form.event}
                        onValueChange={(value) =>
                          setForm((previous) => ({ ...previous, event: value }))
                        }
                      >
                        <SelectTrigger id="trigger-event" className="w-full">
                          <SelectValue placeholder="Selecciona un evento" />
                        </SelectTrigger>
                        <SelectContent>
                          {TRIGGER_EVENTS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Elige cuando se evaluara la condicion del disparador.
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                </div>
              </FieldGroup>

              <FieldSeparator />

              <FieldGroup className="gap-6">
                <Field data-invalid={errors.condition ? true : undefined}>
                  <FieldLabel htmlFor="trigger-condition">Condicion</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="trigger-condition"
                      rows={3}
                      maxLength={MAX_CONDITION_LENGTH}
                      placeholder="Ej. Contiene las palabras bienvenido, hola, asesor."
                      value={form.condition}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          condition: event.target.value,
                        }))
                      }
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <FieldDescription className="text-xs">
                        Describe las reglas o palabras clave que activan el disparador.
                      </FieldDescription>
                      <span>
                        {form.condition.length}/{MAX_CONDITION_LENGTH}
                      </span>
                    </div>
                    <FieldError>{errors.condition}</FieldError>
                  </FieldContent>
                </Field>

                <Field data-invalid={errors.response ? true : undefined}>
                  <FieldLabel htmlFor="trigger-response">Accion o respuesta</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="trigger-response"
                      rows={4}
                      maxLength={MAX_RESPONSE_LENGTH}
                      placeholder="Define el mensaje de respuesta o la accion que debe ejecutarse."
                      value={form.response}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          response: event.target.value,
                        }))
                      }
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <FieldDescription className="text-xs">
                        Puedes incluir variables, instrucciones internas o notas para tu equipo.
                      </FieldDescription>
                      <span>
                        {form.response.length}/{MAX_RESPONSE_LENGTH}
                      </span>
                    </div>
                    <FieldError>{errors.response}</FieldError>
                  </FieldContent>
                </Field>
              </FieldGroup>

              <FieldSeparator />

              <Field orientation="responsive">
                <FieldLabel htmlFor="trigger-active">Estado</FieldLabel>
                <FieldContent>
                  <div className="flex flex-col gap-3 rounded-lg border border-muted-foreground/20 bg-background px-4 py-3 md:flex-row md:items-center md:gap-4">
                    <Switch
                      id="trigger-active"
                      checked={!!form.active}
                      onCheckedChange={(value) =>
                        setForm((previous) => ({ ...previous, active: !!value }))
                      }
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {form.active ? "Disparador activo" : "Disparador en borrador"}
                      </p>
                      <FieldDescription className="text-xs md:text-sm">
                        Desactivalo temporalmente cuando quieras pausar la automatizacion.
                      </FieldDescription>
                    </div>
                  </div>
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
              {eventLabel} se evaluara con la condicion indicada y ejecutara la accion configurada.
            </div>
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={status.loading || !token || !chatbotId}
            >
              {status.loading ? "Guardando..." : "Crear disparador"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="bg-background/80">
        <CardHeader className="gap-1">
          <CardTitle className="text-lg">Disparadores configurados</CardTitle>
          <CardDescription>
            Visualiza tus automatizaciones activas y revisa rapidamente sus condiciones y acciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {triggers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
              Aun no has configurado disparadores. Crea el primero para automatizar tus flujos.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {triggers.map((trigger) => {
                const label =
                  TRIGGER_EVENTS.find((option) => option.value === trigger.event)
                    ?.label ?? trigger.event

                return (
                  <div
                    key={trigger.id}
                    className="flex h-full flex-col gap-3 rounded-lg border border-muted-foreground/20 bg-muted/10 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          {trigger.name || "Sin nombre"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {label}
                        </span>
                      </div>
                      <Badge
                        variant={trigger.active ? "default" : "outline"}
                        className="uppercase"
                      >
                        {trigger.active ? "Activo" : "Pausado"}
                      </Badge>
                    </div>
                    <div className="rounded-md border border-muted-foreground/10 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Condicion:
                      </span>{" "}
                      {trigger.condition || "Sin condicion definida."}
                    </div>
                    <div className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2 text-xs text-primary-foreground/80 dark:text-primary-foreground/60">
                      <span className="font-medium text-foreground">
                        Accion:
                      </span>{" "}
                      {trigger.response || "Sin accion configurada."}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
