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
    <div className="relative h-screen w-full overflow-hidden">
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

      {/* Contenedor del formulario */}
      <div className="relative z-10 flex h-full items-center justify-end px-4 sm:px-6 lg:px-8">
        {/* Formulario con fondo desenfocado */}
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl mr-0 lg:mr-12 xl:mr-20">
          <div className="backdrop-blur-md bg-white/10 dark:bg-black/20 rounded-2xl shadow-2xl p-8 sm:p-10 lg:p-12 border border-white/20">
            <div className="space-y-4">
              {/* Logo */}
              <Link href="https://eliteseller.app/" className="block pb-4">
                {mounted ? (
                  <Image
                    src={
                      theme === "dark"
                        ? "/images/logo-white.png"
                        : "/images/logo-white.png" // Usa logo blanco para mejor contraste
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
