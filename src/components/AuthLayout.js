"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { ModeToggle } from "./mode-toggle";
import LanguageSelector from "./language-selector";

const AuthLayout = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-[100dvh] w-full">
      {/* Video de fondo ocupando todo el viewport */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/bg-auth.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlay oscuro opcional para mejor legibilidad */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Selectores de tema e idioma en la esquina superior derecha */}
      {/* <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <LanguageSelector />
        <ModeToggle />
      </div> */}

      {/* Contenedor del formulario: ocupa la mitad derecha del viewport en desktop */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 min-h-[100dvh]">
        {/* Columna izquierda vacía (video de fondo cubre todo) */}
        <div className="hidden md:block" />
        {/* Columna derecha: sección del formulario */}
        <div className="md:col-start-2 w-full">
          <div className="backdrop-blur-md bg-white/10 dark:bg-black/20 shadow-2xl p-6 sm:p-8 lg:p-12 border border-white/20 text-white">
            <div className="space-y-3 sm:space-y-4">
              {/* Logo */}
              <Link href="https://eliteseller.app/" className="block pb-4">
                {mounted ? (
                  <Image
                    src={
                      theme === "dark"
                      ? "/images/logo-white.png" // Usa logo blanco para mejor contraste
                        : "/images/logo-black.png"
                    }
                    alt="Logo"
                    width={140}
                    height={24}
                    priority
                    className="h-10 w-auto"
                  />
                ) : (
                  <div className="h-8 w-24 bg-white/20 rounded animate-pulse"></div>
                )}
              </Link>

              {/* Contenido principal */}
              <main>{children}</main>

              {/* Aviso legal */}
              {/* <p className="mt-16 text-xs text-white/80 text-center leading-snug">
                Al continuar, acepta los Términos de servicio y la Política de privacidad de Run8in,
                y recibir correos electrónicos periódicos con actualizaciones.
              </p> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
