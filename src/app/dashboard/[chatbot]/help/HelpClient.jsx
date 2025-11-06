"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ExternalLink,
  LifeBuoy,
  BookOpen,
  PlayCircle,
  LinkIcon,
} from "lucide-react";

function inferCategory(item) {
  const text = `${item?.title ?? ""} ${item?.cta ?? ""}`.toLowerCase();
  if (text.includes("video") || text.includes("tutorial")) return "Tutorial";
  if (text.includes("integración") || text.includes("integracion"))
    return "Integración";
  if (text.includes("api")) return "API";
  if (
    text.includes("config") ||
    text.includes("configuración") ||
    text.includes("configuracion")
  )
    return "Configuración";
  if (text.includes("erro") || text.includes("fall"))
    return "Solución de problemas";
  return "Guía";
}

const categoryIcon = (cat) => {
  switch (cat) {
    case "Tutorial":
      return <PlayCircle className="h-4 w-4" />;
    case "Integración":
      return <LinkIcon className="h-4 w-4" />;
    case "API":
      return <BookOpen className="h-4 w-4" />;
    case "Configuración":
      return <LifeBuoy className="h-4 w-4" />;
    case "Solución de problemas":
      return <LifeBuoy className="h-4 w-4" />;
    default:
      return <BookOpen className="h-4 w-4" />;
  }
};

export default function HelpClient({ initialNewsItems = [], helpError }) {
  const params = useParams();
  const chatbotSegmentParam = params?.chatbot;
  const chatbotSegment = useMemo(() => {
    if (!chatbotSegmentParam) return undefined;
    return Array.isArray(chatbotSegmentParam)
      ? chatbotSegmentParam[0]
      : String(chatbotSegmentParam);
  }, [chatbotSegmentParam]);

  // Normalizamos el nombre de la prop para este componente
  const initialHelpItems = Array.isArray(initialNewsItems)
    ? initialNewsItems
    : [];

  // Enriquecemos con categoría inferida
  const prepared = useMemo(
    () =>
      initialHelpItems.map((it) => ({
        ...it,
        category: inferCategory(it),
      })),
    [initialHelpItems]
  );

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todas");

  // Construimos lista de categorías dinámicamente
  const categories = useMemo(() => {
    const set = new Set(prepared.map((i) => i.category || "Guía"));
    return ["Todas", ...Array.from(set)];
  }, [prepared]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prepared.filter((item) => {
      const matchesQuery =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.cta && item.cta.toLowerCase().includes(q));
      const matchesCat =
        activeCategory === "Todas" || item.category === activeCategory;
      return matchesQuery && matchesCat;
    });
  }, [prepared, query, activeCategory]);

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="flex flex-col gap-4 py-4 md:pb-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Centro de Ayuda</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Encuentra guías, tutoriales e integraciones paso a paso.
            </p>
          </div>
        </div>

        {/* Filtros: búsqueda + categorías */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar (ej. 'integración', 'api', 'error')"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted"
                }`}
                aria-pressed={activeCategory === cat}
              >
                {categoryIcon(cat)}
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Errores */}
        {helpError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {helpError}
          </div>
        ) : null}

        {/* Grid de cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className="group overflow-hidden transition hover:shadow-lg"
            >
            <CardHeader>
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-muted py-0.5 text-[11px] font-medium text-muted-foreground">
                    {categoryIcon(item.category)}
                    {item.category}
                </div>
                <CardTitle className="line-clamp-2">{item.title}</CardTitle>
            </CardHeader>  
              {item.image ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden object-cover">
                  <img
                    src={item.image}
                    alt={item.imageAlt || item.title || "Ayuda"}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              ) : null}

              <CardContent className="space-y-4">
                <CardDescription>
                    {item.description ? (
                    <CardDescription className="line-clamp-2">
                    {item.description}
                    </CardDescription>
                ) : null}
                </CardDescription>
                <div className="flex items-center justify-between">
                  <Button asChild size="sm" className="gap-1">
                    <a
                      href={item.href || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir: ${item.title}`}
                    >
                      {item.cta || "Ver guía"}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {!helpError && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/30 p-8 text-center">
            <LifeBuoy className="mb-2 h-6 w-6 text-muted-foreground" />
            <p className="font-medium">No encontramos resultados</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Intenta con otros términos o cambia de categoría.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
