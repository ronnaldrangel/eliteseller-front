"use client"

import { useState } from "react"
import Link from "next/link"
import AuthLayout from "../../../components/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import Turnstile from "react-turnstile"

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [tsToken, setTsToken] = useState("")

  const validateForm = () => {
    if (!email) {
      setError("El email es requerido")
      return false
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("El email no es válido")
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

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Si existe una cuenta con este email, recibirás un enlace para restablecer tu contraseña.")
        setMessage("")
        setEmail("")
      } else {
        toast.error(data.error || "Error al enviar el email de recuperación")
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
      <div className="w-full max-w-xs md:max-w-sm mx-auto">
        <div className="flex flex-col gap-1 mb-6">
          <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tu email para recibir un enlace de recuperación
          </p>
        </div>

        {/* Mensajes de éxito/error ahora se muestran con Sonner */}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@ejemplo.com"
                aria-invalid={Boolean(error)}
                className={error ? "border-destructive" : ""}
              />
              {error && <FieldError>{error}</FieldError>}
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

            <Field>
              <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar enlace de recuperación"
            )}
              </Button>
            </Field>

            <p className="px-6 text-center text-sm text-muted-foreground mt-6">
              ¿Ya tienes una cuenta? {" "}
              <Link href="/auth/login" className="font-medium text-primary underline underline-offset-4">Inicia sesión</Link>
            </p>
          </FieldGroup>
        </form>
      </div>
    </AuthLayout>
  )
}