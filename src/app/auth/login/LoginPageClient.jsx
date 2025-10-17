"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { LoginForm } from "@/components/login-form"
import { toast } from "sonner"

export default function LoginPageClient() {
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const validateFormValues = (email, password) => {
    const newErrors = {}
    if (!email) {
      newErrors.email = "El email es requerido"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "El email no es válido"
    }
    if (!password) {
      newErrors.password = "La contraseña es requerida"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = form.get('email')?.toString() || ''
    const password = form.get('password')?.toString() || ''
    const turnstileToken = form.get('cf-turnstile-response')?.toString() || ''
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

    if (!validateFormValues(email, password)) return

    setIsLoading(true)
    setErrors({})

    try {
      if (siteKey) {
        if (!turnstileToken) {
          toast.error("Completa el desafío de seguridad")
          setIsLoading(false)
          return
        }

        const vResp = await fetch("/api/turnstile/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: turnstileToken }),
        })
        const vData = await vResp.json()
        if (!vResp.ok || !vData?.success) {
          toast.error("Verificación de seguridad falló. Inténtalo de nuevo.")
          setIsLoading(false)
          return
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        try {
          const msgResp = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          })

          const msgData = await msgResp.json()
          const message = msgData?.error?.message || msgData?.message || "Error al iniciar sesión. Inténtalo de nuevo."
          toast.error(message)
        } catch (e) {
          toast.error("Error al iniciar sesión. Inténtalo de nuevo.")
        }
      } else if (result?.ok) {
        window.location.href = "/dashboard"
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch (error) {
      console.error("Error with Google sign in:", error)
      toast.error("Error al iniciar sesión con Google")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <LoginForm onSubmit={handleSubmit} onGoogleClick={handleGoogleSignIn} submitting={isLoading} />
      {(errors.email || errors.password) && (
        <div className="text-destructive text-center mt-2 text-sm">
          {errors.email || errors.password}
        </div>
      )}
    </div>
  )
}