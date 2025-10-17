"use client"

import { useState } from 'react'
import { toast } from 'sonner'
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AccountPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, password, passwordConfirmation }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'No se pudo cambiar la contraseña')
      } else {
        toast.success('Contraseña cambiada correctamente')
        setCurrentPassword('')
        setPassword('')
        setPasswordConfirmation('')
      }
    } catch (err) {
      toast.error('Error de red al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="currentPassword">Contraseña actual</FieldLabel>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Tu contraseña actual"
            autoComplete="current-password"
            required
          />
        </Field>
        
        <Field>
          <FieldLabel htmlFor="password">Nueva contraseña</FieldLabel>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nueva contraseña"
            autoComplete="new-password"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="passwordConfirmation">Confirmar nueva contraseña</FieldLabel>
          <Input
            id="passwordConfirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder="Confirmar nueva contraseña"
            autoComplete="new-password"
            required
          />
        </Field>

        <Field>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Guardando…' : 'Cambiar contraseña'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}