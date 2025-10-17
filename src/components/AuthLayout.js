"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { ModeToggle } from './mode-toggle'
import LanguageSelector from './language-selector'

const AuthLayout = ({ children }) => {
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])
  
  return (
    <div className="h-screen bg-background">
      {/* Selectores de tema e idioma en la esquina superior derecha */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <LanguageSelector />
        <ModeToggle />
      </div>

      {/* Logo en la esquina superior izquierda */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/" className="block">
          {mounted ? (
            <Image
              src={theme === "dark" ? "/images/logo-white.png" : "/images/logo-black.png"}
              alt="Logo"
              width={140}
              height={24}
              priority
              className="h-10 w-auto"
            />
          ) : (
            <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
          )}
        </Link>
      </div>

      <div className="flex min-h-full flex-1">
        {/* Lado izquierdo - Formulario */}
        <div className="flex flex-1 w-full lg:w-1/2 flex-col justify-center px-8 pt-12 pb-2 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-background">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Contenido principal */}
            <main>{children}</main>
            {/* Aviso legal dentro del contenedor, más abajo */}
            {/* <p className="mt-16 text-xs text-muted-foreground text-center leading-snug">
              Al continuar, acepta los Términos de servicio y la Política de privacidad de Run8in,
              y recibir correos electrónicos periódicos con actualizaciones.
            </p> */}
          </div>
        </div>

        {/* Lado derecho - Video de fondo */}
        <div className="relative hidden w-1/2 lg:block">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/videos/bg-auth.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout