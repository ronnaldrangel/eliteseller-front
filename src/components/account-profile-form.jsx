"use client"

import { useState } from 'react'
import { toast } from 'sonner'
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AccountProfileForm({ initialName = '', initialPhone = '' }) {
  const [name, setName] = useState(initialName || '')
  const [phone, setPhone] = useState(initialPhone || '')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/account/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'No se pudo actualizar el perfil')
      } else {
        toast.success('Perfil actualizado correctamente')
      }
    } catch (err) {
      toast.error('Error de red al actualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Nombre</FieldLabel>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Tu teléfono"
          />
        </Field>

        <Field>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}