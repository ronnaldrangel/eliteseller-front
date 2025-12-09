"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/contexts/language-context";

const LanguageSelector = () => {
  const { language, setLanguage, ready, t } = useTranslation();

  const languages = useMemo(
    () => [
      { code: "es", name: "Espanol", flag: "🇪🇸" },
      { code: "en", name: "English", flag: "🇺🇸" },
      { code: "fr", name: "Francais", flag: "🇫🇷" },
    ],
    []
  );

  const handleLanguageChange = (languageCode) => {
    setLanguage(languageCode);
  };

  if (!ready) {
    return <div className="w-9 h-9 bg-muted rounded-md animate-pulse" />;
  }

  const currentLang = languages.find((lang) => lang.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("common.languageSelector", { fallback: "Seleccionar idioma" })}
          className="border-0"
        >
          <span className="text-sm" aria-hidden="true">
            {currentLang?.flag}
          </span>
          <span className="sr-only">
            {t("common.currentLanguage", {
              fallback: "Idioma actual: {{language}}",
              values: { language: currentLang?.name || "" },
            })}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((item) => (
          <DropdownMenuItem
            key={item.code}
            onClick={() => handleLanguageChange(item.code)}
            className={language === item.code ? "font-medium text-primary" : ""}
          >
            <span className="mr-2" aria-hidden="true">
              {item.flag}
            </span>
            <span>{item.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
