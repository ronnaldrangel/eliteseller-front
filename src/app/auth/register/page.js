"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import AuthLayout from "../../../components/AuthLayout"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { toast } from "sonner"
import { Field, FieldGroup, FieldLabel, FieldSeparator, FieldError } from "@/components/ui/field"
import { Loader2, CheckCircle2, Circle, Eye, EyeOff } from "lucide-react"
import { PhoneInput } from "@/components/ui/phone-input"
import Turnstile from "react-turnstile"

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [passwordChecks, setPasswordChecks] = useState({
    upper: false,
    lower: false,
    number: false,
    special: false,
    length: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [tsToken, setTsToken] = useState("")

  const generateUsernameFromEmail = (email) => {
    if (!email || typeof email !== "string") return ""
    const local = email.split("@")[0] || ""
    // Sanitizar: minúsculas y caracteres permitidos a-z 0-9 . _ -
    return local.toLowerCase().replace(/[^a-z0-9._-]/g, "")
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = "El email es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido"
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
    } else {
      const checks = {
        upper: /[A-Z]/.test(formData.password),
        lower: /[a-z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
        special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password),
        length: formData.password.length >= 8,
      }
      setPasswordChecks(checks)
      const allOk = Object.values(checks).every(Boolean)
      if (!allOk) {
        newErrors.password = "La contraseña no cumple los requisitos"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

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

      const payload = {
        ...formData,
        username: formData.username || generateUsernameFromEmail(formData.email),
      }
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Cuenta creada. Revisa tu email para verificarla.")
        window.location.href = `/auth/verify-email?email=${encodeURIComponent(formData.email)}`
      } else {
        // Manejar errores específicos
        if (data.error) {
          if (data.error.includes("email")) {
            setErrors({ email: "Este email ya está registrado" })
          } else if (data.error.includes("username")) {
            toast.error("Nombre de usuario en uso. Prueba con otro correo.")
          } else {
            toast.error(data.error)
          }
        } else {
          toast.error("Error en el registro. Inténtalo de nuevo.")
        }
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

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === "email") {
      const autoUsername = generateUsernameFromEmail(value)
      setFormData(prev => ({
        ...prev,
        email: value,
        username: autoUsername,
      }))
    } else if (name === "password") {
      const checks = {
        upper: /[A-Z]/.test(value),
        lower: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value),
        length: value.length >= 8,
      }
      setPasswordChecks(checks)
      setFormData(prev => ({
        ...prev,
        password: value,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-xs md:max-w-sm mx-auto">
        <div className="space-y-1 text-left mb-6">
          <h1 className="text-2xl font-extrabold">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground">Completa el formulario para crear tu cuenta</p>
        </div>

        {/* Mensajes de éxito/error ahora se muestran con Sonner */}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            {/* Campo de nombre de usuario eliminado: se autogenera desde el email */}
            <Field>
              <FieldLabel htmlFor="name">Nombre</FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Tu nombre"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@ejemplo.com"
                aria-invalid={Boolean(errors.email)}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <FieldError>{errors.email}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
              <PhoneInput
                id="phone"
                name="phone"
                placeholder="Tu teléfono"
                value={formData.phone}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, phone: value || "" }))
                }
                international
                defaultCountry="ES"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors.password)}
                  className={(errors.password ? "border-destructive " : "") + "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <FieldError>{errors.password}</FieldError>
              )}
              {formData.password && (
                <ul className="mt-1 space-y-1 text-xs leading-tight">
                  <li className="flex items-center gap-2">
                    {passwordChecks.upper ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span>Letra mayúscula</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    {passwordChecks.lower ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span>Letra minúscula</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    {passwordChecks.number ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span>Número</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    {passwordChecks.special ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span>Carácter especial (p. ej. !?&lt;&gt;@#$%)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    {passwordChecks.length ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span>8 caracteres o más</span>
                  </li>
                </ul>
              )}
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
                  Creando cuenta...
                </>
              ) : (
                "Crear cuenta"
              )}
              </Button>
            </Field>

            {/* <p className="px-8 text-center text-xs text-muted-foreground">
              Al crear una cuenta, aceptas nuestros {" "}
              <Link href="/terms" className="underline underline-offset-4">Términos de servicio</Link>
              {" "}y nuestra {" "}
              <Link href="/privacy" className="underline underline-offset-4">Política de privacidad</Link>.
            </p> */}

            <FieldSeparator>O continúa con</FieldSeparator>

            <Field>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </Button>
            </Field>
          </FieldGroup>
          </form>

        <p className="px-6 text-center text-sm text-muted-foreground mt-6">
          ¿Ya tienes una cuenta? {" "}
          <Link href="/auth/login" className="font-medium text-primary underline underline-offset-4">Inicia sesión</Link>
        </p>
      </div>
    </AuthLayout>
  )
}