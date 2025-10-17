"use client"

import { useState } from "react"
import Turnstile from "react-turnstile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, EyeOff } from "lucide-react"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  onGoogleClick,
  submitting = false,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [tsToken, setTsToken] = useState("")
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Iniciar sesión</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Ingresa tu correo para acceder a tu cuenta
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
          <Input id="email" name="email" type="email" placeholder="tu@ejemplo.com" required />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <a href="/auth/forgot-password" className="ml-auto text-sm underline-offset-4 hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              className="pr-10"
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
        </Field>
        {siteKey ? (
          <Field>
            <Turnstile
              sitekey={siteKey}
              onVerify={(token) => setTsToken(token)}
            />
            <input type="hidden" name="cf-turnstile-response" value={tsToken} />
          </Field>
        ) : null}
        <Field>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </Field>
        <FieldSeparator>O continúa con</FieldSeparator>
        <Field>
          <Button variant="outline" type="button" onClick={onGoogleClick}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </Button>
          <FieldDescription className="text-center pt-4">
            ¿No tienes una cuenta?{" "}
            <a href="/auth/register" className="underline underline-offset-4  text-primary">
              Regístrate
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
