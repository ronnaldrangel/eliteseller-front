"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
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

  // Se elimina buscador y tabs de categorías; se muestran todas las cards.

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Centro de Ayuda</h1>
            <p className="text-sm text-muted-foreground">
              Encuentra guías, tutoriales e integraciones paso a paso.
            </p>
          </div>
        </div>

        {/* Buscador y tabs eliminados */}

        {/* Errores */}
        {helpError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {helpError}
          </div>
        ) : null}

        {/* Grid de cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
          {prepared.map((item) => (
            <Card
              key={item.id}
              className="group overflow-hidden transition hover:shadow-lg h-full flex flex-col"
            >

              <CardContent className="space-y-2 text-left flex flex-1 flex-col">

                {item.image ? (
                  <div className="w-[100px] h-[100px] rounded-full overflow-hidden border">
                    <img
                      src={item.image}
                      alt={item.imageAlt || item.title || "Ayuda"}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}

                <CardTitle className="mt-6 line-clamp-2 text-left">{item.title}</CardTitle>

                {item.description ? (
                  <CardDescription className="line-clamp-3 text-left mb-6">
                    {item.description}
                  </CardDescription>
                ) : null}

                <Button asChild className="mt-auto w-full gap-1">
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
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {!helpError && prepared.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/30 p-8 text-center">
            <LifeBuoy className="mb-2 h-6 w-6 text-muted-foreground" />
            <p className="font-medium">No encontramos resultados</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No hay contenido disponible por ahora.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
