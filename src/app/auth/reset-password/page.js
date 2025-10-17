"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import AuthLayout from "../../../components/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
// Removed Card UI wrapper for the form
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import Turnstile from "react-turnstile"

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AuthLayout>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [code, setCode] = useState("")
  const [tsToken, setTsToken] = useState("")
  
  const searchParams = useSearchParams()

  useEffect(() => {
    const codeParam = searchParams.get("code")
    if (codeParam) {
      setCode(codeParam)
    } else {
      setError("Código de verificación no encontrado. Por favor, solicita un nuevo enlace de recuperación.")
    }
  }, [searchParams])

  const validateForm = () => {
    if (!password) {
      setError("La contraseña es requerida")
      return false
    }
    
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return false
    }
    
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      if (SITE_KEY) {
        if (!tsToken) {
          toast.error("Completa el desafío de seguridad")
          setIsLoading(false)
          return
        }
        const vResp = await fetch("/api/turnstile/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tsToken }),
        })
        const vData = await vResp.json()
        if (!vResp.ok || !vData?.success) {
          toast.error("Verificación de seguridad falló. Inténtalo de nuevo.")
          setIsLoading(false)
          return
        }
      }

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Contraseña actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.")
        setMessage("")
        setPassword("")
        setConfirmPassword("")
      } else {
        toast.error(data.error || "Error al restablecer la contraseña")
        setError("")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold">Restablecer contraseña</h1>
          <p className="text-sm text-muted-foreground">Ingresa tu nueva contraseña</p>
        </div>

        <div className="space-y-6 mt-6">
          {/* Mensajes de éxito/error ahora se muestran con Sonner */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">Nueva contraseña</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">Confirmar contraseña</FieldLabel>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                />
              </Field>

              {SITE_KEY ? (
                <Field>
                  <Turnstile
                    sitekey={SITE_KEY}
                    onVerify={(token) => setTsToken(token)}
                  />
                  <input type="hidden" name="cf-turnstile-response" value={tsToken} />
                </Field>
              ) : null}

              <Button type="submit" disabled={isLoading || !code} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar contraseña"
              )}
              </Button>

            <div className="text-center">
              <Link href="/auth/login" className="text-sm text-primary hover:underline">
                Volver al inicio de sesión
              </Link>
            </div>
            </FieldGroup>
          </form>
        </div>
      </div>
    </AuthLayout>
  )
}