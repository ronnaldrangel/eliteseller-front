"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import es from "@/locales/es.json";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

const TRANSLATIONS = { es, en, fr };
const SUPPORTED_LANGUAGES = Object.keys(TRANSLATIONS);
const DEFAULT_LANGUAGE = "es";
const STORAGE_KEY = "eliteseller.language";

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  ready: false,
  setLanguage: () => {},
  t: (key, options) => options?.fallback || key,
});

const normalizeLanguage = (value) => {
  if (!value) return DEFAULT_LANGUAGE;
  const normalized = value.toLowerCase();
  if (SUPPORTED_LANGUAGES.includes(normalized)) {
    return normalized;
  }
  const short = normalized.split("-")[0];
  return SUPPORTED_LANGUAGES.includes(short) ? short : DEFAULT_LANGUAGE;
};

const interpolate = (template, values) => {
  if (!template || !values) return template;
  return Object.entries(values).reduce(
    (acc, [key, val]) =>
      acc.replaceAll(`{{${key}}}`, typeof val === "undefined" ? "" : String(val)),
    template
  );
};

const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  const applyHtmlLang = useCallback((lang) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", lang);
    }
  }, []);

  useEffect(() => {
    const detectLanguage = () => {
      if (typeof window === "undefined") {
        return DEFAULT_LANGUAGE;
      }
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return normalizeLanguage(saved);
      }
      if (window.navigator?.language) {
        return normalizeLanguage(window.navigator.language);
      }
      return DEFAULT_LANGUAGE;
    };

    const nextLang = detectLanguage();
    setLanguageState(nextLang);
    applyHtmlLang(nextLang);
    setReady(true);
  }, [applyHtmlLang]);

  const setLanguage = useCallback(
    (nextLanguage) => {
      const normalized = normalizeLanguage(nextLanguage);
      setLanguageState(normalized);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, normalized);
      }
      applyHtmlLang(normalized);
    },
    [applyHtmlLang]
  );

  const translate = useCallback(
    (key, options = {}) => {
      const dictionary = TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE];
      const segments = key.split(".");
      const resolved = segments.reduce(
        (acc, segment) => (acc && acc[segment] !== undefined ? acc[segment] : undefined),
        dictionary
      );
      const message =
        typeof resolved === "string"
          ? resolved
          : typeof options?.fallback === "string"
            ? options.fallback
            : key;
      return interpolate(message, options?.values);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      ready,
      setLanguage,
      t: translate,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, ready, setLanguage, translate]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

const useLanguage = () => useContext(LanguageContext);

const useTranslation = () => {
  const context = useLanguage();
  return {
    language: context.language,
    ready: context.ready,
    setLanguage: context.setLanguage,
    t: context.t,
  };
};

export { LanguageProvider, useLanguage, useTranslation, SUPPORTED_LANGUAGES };
