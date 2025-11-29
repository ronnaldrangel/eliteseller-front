"use client"

import { useState } from "react"
import { buildStrapiUrl } from "@/lib/strapi"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CheckCircle2Icon } from "lucide-react"
import { toast } from "sonner"

export default function ChatbotEditForm({ initialData = {}, chatbotSlug, token }) {
  const base = initialData?.attributes || initialData || {}
  const initialBanWords = Array.isArray(base.ban_words)
    ? base.ban_words.map((w) => (typeof w === "string" ? w.trim() : "")).filter(Boolean)
    : String(base.ban_words || "")
      .split(/[,;\n]/)
      .map((w) => w.trim())
      .filter(Boolean)

  const [form, setForm] = useState({
    chatbot_name: base.chatbot_name ?? "EliteSellet",
    company_name: base.company_name ?? "",
    gender: base.gender ?? "",
    country: base.country ?? "",
    company_description: base.company_description ?? "",
    instructions: base.instructions ?? "general product support",
    target: base.target ?? "broad consumer audience",
    emoji: typeof base.emoji === 'boolean' ? base.emoji : !!base.emoji,
    signs: typeof base.signs === 'boolean' ? base.signs : !!base.signs,
    available_emojis: base.available_emojis ?? "",
    style_sale: base.style_sale ?? "consultative",
    style_communication: base.style_communication ?? "friendly, concise, and clear",
    response_length: base.response_length ?? "Balance",
    welcome_message: base.welcome_message ?? "",
    confirmation_message: base.confirmation_message ?? "",
    human_derivation_message: base.human_derivation_message ?? "",
    catalog_message: base.catalog_message ?? "",
  })

  const [status, setStatus] = useState({ loading: false, type: null, message: null })
  const [banWordsList, setBanWordsList] = useState(initialBanWords)
  const [banWordInput, setBanWordInput] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  const personalityTemplates = [
    {
      id: "ramoncito",
      label: "Ramoncito",
      description: "Directo y con urgencia para cerrar ventas",
      value: "tono directo, urgencia alta, orientado a cerrar ventas rapido con llamadas a la accion claras",
    },
    {
      id: "miguel",
      label: "Miguel",
      description: "Configuracion actual",
      value: base.style_communication ?? form.style_communication ?? "friendly, concise, and clear",
    },
    {
      id: "daniel",
      label: "Daniel",
      description: "Formal y sin emotividad",
      value: "tono robotico, formal y preciso, sin emotividad, respuestas secas y estructuradas",
    },
    {
      id: "ronald",
      label: "Ronald",
      description: "Chill y relajado",
      value: "tono chill, relajado y cercano, mensajes breves y tranquilos",
    },
  ]

  const applyTemplate = (template) => {
    if (!template) return
    setSelectedTemplate(template.id)
    setForm((prev) => ({ ...prev, style_communication: template.value }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleToggleEmoji = (checked) => {
    setForm((prev) => ({ ...prev, emoji: checked }))
  }

  const handleToggleSigns = (checked) => {
    setForm((prev) => ({ ...prev, signs: checked }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ loading: true, type: null, message: null })
    try {
      // Sanitizar tipos: asegurar booleanos y convertir strings vacíos a null donde aplique
      const payload = {
        ...form,
        emoji: !!form.emoji,
        signs: !!form.signs,
        ban_words: banWordsList.length === 0 ? null : banWordsList,
        available_emojis: form.available_emojis === "" ? null : form.available_emojis,
      }

      const res = await fetch(buildStrapiUrl(`/api/chatbots/${chatbotSlug}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ data: payload }),
      })

      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = body?.error?.message || 'No se pudo actualizar el chatbot'
        setStatus({ loading: false, type: null, message: null })
        toast.error(msg)
      } else {
        setStatus({ loading: false, type: null, message: null })
        toast.success('Guardado correctamente')
      }
    } catch (err) {
      setStatus({ loading: false, type: null, message: null })
      toast.error('Error de red al actualizar')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-xl border bg-card p-5 space-y-6">
        <h4 className="text-lg font-semibold flex items-center gap-2"><CheckCircle2Icon className="size-4 text-muted-foreground" /> Información básica</h4>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="chatbot_name">Nombre del chatbot</FieldLabel>
            <Input id="chatbot_name" name="chatbot_name" value={form.chatbot_name} onChange={handleChange} />
          </Field>
          <Field>
            <FieldLabel htmlFor="company_name">Nombre de la empresa</FieldLabel>
            <Input id="company_name" name="company_name" value={form.company_name} onChange={handleChange} />
          </Field>
          <Field>
            <FieldLabel htmlFor="gender">Género</FieldLabel>
            <ToggleGroup
              type="single"
              value={form.gender || ""}
              onValueChange={(value) => setForm((prev) => ({ ...prev, gender: value }))}
              className="w-full grid grid-cols-1 md:inline-flex md:w-fit md:overflow-hidden md:rounded-md md:border md:p-0"
              variant="outline">
              <ToggleGroupItem value="male" className="w-full border rounded-xl md:border-0 md:rounded-none md:first:rounded-l-md md:last:rounded-r-md">Masculino</ToggleGroupItem>
              <ToggleGroupItem value="female" className="w-full border rounded-xl md:border-0 md:rounded-none md:first:rounded-l-md md:last:rounded-r-md">Femenino</ToggleGroupItem>
              <ToggleGroupItem value="neutral" className="w-full border rounded-xl md:border-0 md:rounded-none md:first:rounded-l-md md:last:rounded-r-md">No especificado</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="country">País</FieldLabel>
            <Select value={form.country || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, country: value }))}>
              <SelectTrigger id="country" className="w-full">
                <SelectValue placeholder="Selecciona país" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Peru">Perú</SelectItem>
                <SelectItem value="Mexico">México</SelectItem>
                <SelectItem value="Colombia">Colombia</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="company_description">Descripción de la empresa</FieldLabel>
            <Textarea id="company_description" name="company_description" value={form.company_description} onChange={handleChange} rows={3} />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-6">
        <h4 className="text-lg font-semibold flex items-center gap-2"><CheckCircle2Icon className="size-4 text-muted-foreground" /> Audiencia e instrucciones</h4>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="target">Público objetivo</FieldLabel>
            <Input id="target" name="target" value={form.target} onChange={handleChange} />
          </Field>
          <Field>
            <FieldLabel htmlFor="instructions">Instrucciones</FieldLabel>
            <Input id="instructions" name="instructions" value={form.instructions} onChange={handleChange} />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-6">
        <h4 className="text-lg font-semibold flex items-center gap-2"><CheckCircle2Icon className="size-4 text-muted-foreground" /> Personalidad</h4>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-3">
            <div className="text-sm font-medium">Plantillas de personalidad</div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {personalityTemplates.map((tpl) => (
                <Button
                  key={tpl.id}
                  type="button"
                  variant={selectedTemplate === tpl.id ? "default" : "outline"}
                  className="h-full justify-start text-left flex flex-col gap-1"
                  onClick={() => applyTemplate(tpl)}
                >
                  <span className={`font-semibold text-sm ${selectedTemplate === tpl.id ? 'text-white' : ''}`}>{tpl.label}</span>
                  <span className={`text-xs ${selectedTemplate === tpl.id ? 'text-white' : 'text-muted-foreground'}`}>{tpl.description}</span>
                </Button>
              ))}
            </div>
          </div>
          <Field>
            <FieldLabel htmlFor="style_communication">Estilo de comunicación</FieldLabel>
            <Textarea id="style_communication" name="style_communication" value={form.style_communication} onChange={handleChange} rows={3} placeholder="friendly, concise, and clear" />
          </Field>
          <Field>
            <FieldLabel htmlFor="style_sale">Estilo de venta</FieldLabel>
            <Textarea id="style_sale" name="style_sale" value={form.style_sale} onChange={handleChange} placeholder="consultative" />
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="response_length">Longitud de respuesta</FieldLabel>
            <ToggleGroup
              type="single"
              value={form.response_length || "Balance"}
              onValueChange={(value) => setForm((prev) => ({ ...prev, response_length: value }))}
              className="w-full grid grid-cols-1 gap-2 md:gap-0 md:inline-flex md:w-fit md:overflow-hidden md:rounded-md md:border md:p-0"
              variant="outline"
            >
              <ToggleGroupItem value="Very concise" className="w-full border rounded-xl md:border-0 md:rounded-none md:first:rounded-l-md md:last:rounded-r-md text-xs sm:text-sm">Muy concisa</ToggleGroupItem>
              <ToggleGroupItem value="Concise" className="w-full border rounded-xl md:border-0 md:rounded-none md:first:rounded-l-md md:last:rounded-r-md text-xs sm:text-sm">Concisa</ToggleGroupItem>
              <ToggleGroupItem value="Balance" className="w-full border rounded-xl md:border-0 md:rounded-none md:first:rounded-l-md md:last:rounded-r-md text-xs sm:text-sm">Balanceada</ToggleGroupItem>
              <ToggleGroupItem value="Detailed" className="w-full border rounded-xl md:border-0 md:rounded-none md:first:rounded-l-md md:last:rounded-r-md text-xs sm:text-sm">Detallada</ToggleGroupItem>
              <ToggleGroupItem value="Very detailed" className="w-full border rounded-xl md:border-0 md:rounded-none md:first:rounded-l-md md:last:rounded-r-md text-xs sm:text-sm">Muy detallada</ToggleGroupItem>
            </ToggleGroup>
          </Field>

          <Field>
            <div className="flex items-center gap-3 rounded-full border bg-muted/30 px-4 py-2">
              <Switch id="emoji" checked={form.emoji} onCheckedChange={handleToggleEmoji} />
              <span className="text-sm">¿Usar emojis?</span>
            </div>
          </Field>
          <Field>
            <div className="flex items-center gap-3 rounded-full border bg-muted/30 px-4 py-2">
              <Switch id="signs" checked={form.signs} onCheckedChange={handleToggleSigns} />
              <span className="text-sm">¿Usar signos?</span>
            </div>
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="ban_words">Palabras prohibidas</FieldLabel>
            <div>
              <div className="flex flex-wrap gap-2">
                {banWordsList.map((word, index) => (
                  <span
                    key={`${word}-${index}`}
                    className="inline-flex items-center rounded-md border border-muted-foreground/20 bg-muted/20 px-2 py-1 text-xs"
                  >
                    {word}
                    <button
                      type="button"
                      onClick={() =>
                        setBanWordsList((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="ml-2 rounded p-0.5 text-muted-foreground hover:bg-muted/40"
                      aria-label={`Quitar palabra ${word}`}
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
              <Input
                id="ban_words"
                placeholder="Escribe una palabra y presiona enter"
                value={banWordInput}
                onChange={(e) => setBanWordInput(e.target.value)}
                onBlur={() => {
                  const next = banWordInput.trim()
                  if (next) {
                    setBanWordsList((prev) => (prev.includes(next) ? prev : [...prev, next]))
                    setBanWordInput("")
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    const next = banWordInput.trim()
                    if (next) {
                      setBanWordsList((prev) => (prev.includes(next) ? prev : [...prev, next]))
                      setBanWordInput("")
                    }
                  } else if (e.key === "Backspace" && banWordInput.length === 0) {
                    setBanWordsList((prev) => prev.slice(0, -1))
                  }
                }}
                className="mt-2"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Se guardan al presionar Enter o al salir del campo.
              </p>
            </div>
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="available_emojis">Emojis disponibles</FieldLabel>
            <Textarea
              id="available_emojis"
              placeholder="ej. 😊, 🚀"
              value={form.available_emojis}
              onChange={(e) => setForm({ ...form, available_emojis: e.target.value })}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-6">
        <h4 className="text-lg font-semibold flex items-center gap-2"><CheckCircle2Icon className="size-4 text-muted-foreground" /> Mensajes</h4>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="welcome_message">Mensaje de bienvenida</FieldLabel>
            <Textarea id="welcome_message" name="welcome_message" value={form.welcome_message} onChange={handleChange} rows={3} />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmation_message">Mensaje de confirmación</FieldLabel>
            <Textarea id="confirmation_message" name="confirmation_message" value={form.confirmation_message} onChange={handleChange} rows={3} />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="human_derivation_message">Mensaje de derivación a humano</FieldLabel>
            <Textarea id="human_derivation_message" name="human_derivation_message" value={form.human_derivation_message} onChange={handleChange} rows={3} />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="catalog_message">Mensaje del catálogo</FieldLabel>
            <Textarea id="catalog_message" name="catalog_message" value={form.catalog_message} onChange={handleChange} rows={4} />
          </Field>
        </div>
      </div>

      <div className="flex w-full items-center gap-3 mb-6">
        <Button type="submit" className="w-full" disabled={status.loading}>
          {status.loading ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
