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

export default function ChatbotEditForm({ initialData = {}, chatbotId, token }) {
  const base = initialData?.attributes || initialData || {}

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
    ban_words: base.ban_words ?? "",
    available_emojis: base.available_emojis ?? "",
    style_sale: base.style_sale ?? "consultative",
    style_communication: base.style_communication ?? "friendly, concise, and clear",
    response_length: base.response_length ?? "Balance",
    welcome_message: base.welcome_message ?? "",
    confirmation_message: base.confirmation_message ?? "",
    human_derivation_message: base.human_derivation_message ?? "",
  })

  const [status, setStatus] = useState({ loading: false, type: null, message: null })



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
        ban_words: form.ban_words === "" ? null : form.ban_words,
        available_emojis: form.available_emojis === "" ? null : form.available_emojis,
      }

      const res = await fetch(buildStrapiUrl(`/api/chatbots/${chatbotId}`), {
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
        setStatus({ loading: false, type: 'error', message: msg })
      } else {
        setStatus({ loading: false, type: 'success', message: 'Guardado correctamente' })
      }
    } catch (err) {
      setStatus({ loading: false, type: 'error', message: 'Error de red al actualizar' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
        <h4 className="text-lg font-semibold">Información básica</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="chatbot_name">Nombre del chatbot</Label>
            <Input id="chatbot_name" name="chatbot_name" value={form.chatbot_name} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_name">Nombre de la empresa</Label>
            <Input id="company_name" name="company_name" value={form.company_name} onChange={handleChange} />
          </div>
          <Field>
            <FieldLabel htmlFor="gender">Género</FieldLabel>
            <Select value={form.gender || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, gender: value }))}>
              <SelectTrigger id="gender" className="w-full">
                <SelectValue placeholder="Selecciona género" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Femenino</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
              </SelectContent>
            </Select>
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
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company_description">Descripción de la empresa</Label>
            <Textarea id="company_description" name="company_description" value={form.company_description} onChange={handleChange} rows={3} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
        <h4 className="text-lg font-semibold">Personalidad</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="response_length">Longitud de respuesta</FieldLabel>
            <Select value={form.response_length || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, response_length: value }))}>
              <SelectTrigger id="response_length" className="w-full">
                <SelectValue placeholder="Selecciona longitud" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Very concise">Very concise</SelectItem>
                <SelectItem value="Concise">Concise</SelectItem>
                <SelectItem value="Balance">Balance</SelectItem>
                <SelectItem value="Detailed">Detailed</SelectItem>
                <SelectItem value="Very detailed">Very detailed</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="space-y-2">
            <Label htmlFor="style_sale">Estilo de venta</Label>
            <Input id="style_sale" name="style_sale" value={form.style_sale} onChange={handleChange} placeholder="consultative" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="style_communication">Estilo de comunicación</Label>
            <Textarea id="style_communication" name="style_communication" value={form.style_communication} onChange={handleChange} rows={3} placeholder="friendly, concise, and clear" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signs">Usar signos</Label>
            <div className="flex items-center gap-2">
              <Switch id="signs" checked={form.signs} onCheckedChange={handleToggleSigns} />
              <span className="text-sm text-muted-foreground">Activa o desactiva signos</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ban_words">Palabras prohibidas</Label>
            <Textarea id="ban_words" name="ban_words" value={form.ban_words} onChange={handleChange} rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="available_emojis">Emojis disponibles</Label>
            <Input id="available_emojis" name="available_emojis" value={form.available_emojis} onChange={handleChange} placeholder="🙂👍🎉✅" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emoji">Usar emojis</Label>
            <div className="flex items-center gap-2">
              <Switch id="emoji" checked={form.emoji} onCheckedChange={handleToggleEmoji} />
              <span className="text-sm text-muted-foreground">Activa o desactiva el uso de emojis</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
        <h4 className="text-lg font-semibold">Audiencia e instrucciones</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="target">Público objetivo</Label>
            <Input id="target" name="target" value={form.target} onChange={handleChange} />
          </div>
          <div className="space-y-2">
             <Label htmlFor="instructions">Instrucciones</Label>
             <Input id="instructions" name="instructions" value={form.instructions} onChange={handleChange} />
           </div>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
        <h4 className="text-lg font-semibold">Mensajes</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="welcome_message">Mensaje de bienvenida</Label>
            <Textarea id="welcome_message" name="welcome_message" value={form.welcome_message} onChange={handleChange} rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmation_message">Mensaje de confirmación</Label>
            <Textarea id="confirmation_message" name="confirmation_message" value={form.confirmation_message} onChange={handleChange} rows={3} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="human_derivation_message">Mensaje de derivación a humano</Label>
            <Textarea id="human_derivation_message" name="human_derivation_message" value={form.human_derivation_message} onChange={handleChange} rows={3} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status.loading}>
          {status.loading ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        {status.type && (
          <span className={status.type === 'success' ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
            {status.message}
          </span>
        )}
      </div>
    </form>
  )
}