"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const LanguageSelector = () => {
  const [mounted, setMounted] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('es')

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ]

  useEffect(() => {
    setMounted(true)
    const savedLanguage = typeof window !== 'undefined'
      ? localStorage.getItem('language') || 'es'
      : 'es'
    setCurrentLanguage(savedLanguage)
  }, [])

  const handleLanguageChange = (languageCode) => {
    setCurrentLanguage(languageCode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', languageCode)
    }
    // Aquí podrías disparar un evento o actualizar un contexto global
  }

  if (!mounted) {
    return (
      <div className="w-9 h-9 bg-muted rounded-md animate-pulse"></div>
    )
  }

  const currentLang = languages.find(lang => lang.code === currentLanguage)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Seleccionar idioma" className="border-0">
          <span className="text-sm">{currentLang?.flag}</span>
          <span className="sr-only">Idioma actual: {currentLang?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={currentLanguage === language.code ? "font-medium text-primary" : ""}
          >
            <span className="mr-2">{language.flag}</span>
            <span>{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageSelector