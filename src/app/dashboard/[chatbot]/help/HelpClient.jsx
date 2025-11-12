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
import { ExternalLink, LifeBuoy } from "lucide-react";


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

  // Lista de items sin categorías
  const items = initialHelpItems;

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

        {/* Buscador y tabs eliminados; sin categorías */}

        {/* Errores */}
        {helpError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {helpError}
          </div>
        ) : null}

        {/* Grid de cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
          {items.map((item) => (
            <Card
              key={item.id}
              className="group overflow-hidden transition hover:shadow-lg h-full flex flex-col"
            >

              <CardContent className="space-y-2 text-left flex flex-1 flex-col">

                {item.image ? (
                  <div className="w-[100px] h-auto">
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
        {!helpError && items.length === 0 ? (
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
