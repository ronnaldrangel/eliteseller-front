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
import { ArrowRight, X as CloseIcon } from "lucide-react";

const STAT_ITEMS = [
  { key: "activeChats", label: "Chats activos", helper: "Ultimas 24 horas" },
  { key: "newLeads", label: "Nuevos leads", helper: "Ultimos 7 dias" },
  {
    key: "conversionRate",
    label: "Tasa de conversion",
    helper: "Respecto al total de leads",
  },
  {
    key: "averageResponse",
    label: "Promedio de respuesta",
    helper: "Ultimos 30 dias",
  },
  {
    key: "closedSales",
    label: "Ventas cerradas",
    helper: "Marcadas como venta",
  },
  {
    key: "activeCampaigns",
    label: "Campanas activas",
    helper: "Triggers disponibles",
  },
];

const INITIAL_STATS = {
  activeChats: null,
  newLeads: null,
  conversionRate: null,
  averageResponseLabel: null,
  closedSales: null,
  activeCampaigns: null,
};

export default function DocsPageClient({ initialNewsItems = [], newsError }) {
  const params = useParams();
  const chatbotSegmentParam = params?.chatbot;
  const chatbotSegment = useMemo(() => {
    if (!chatbotSegmentParam) return undefined;
    return Array.isArray(chatbotSegmentParam)
      ? chatbotSegmentParam[0]
      : String(chatbotSegmentParam);
  }, [chatbotSegmentParam]);

  // Novedades recibidas del server
  const [newsItems, setNewsItems] = useState(
    Array.isArray(initialNewsItems) ? initialNewsItems : []
  );
  const [activeSlide, setActiveSlide] = useState(0);

  // Stats
  const [statsData, setStatsData] = useState({ ...INITIAL_STATS });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Cerrado de la sección de bienvenida gaaaa
  const [showWelcome, setShowWelcome] = useState(true);
  const WELCOME_CACHE_KEY = useMemo(
    () => `welcomeCard:${chatbotSegment || "global"}:v1`,
    [chatbotSegment]
  );

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(WELCOME_CACHE_KEY) === "1";
      if (dismissed) setShowWelcome(false);
    } catch {
      // si localStorage falla (modo privado, etc.), ignoramos
    }
  }, [WELCOME_CACHE_KEY]);

  const handleCloseWelcome = () => {
    try {
      localStorage.setItem(WELCOME_CACHE_KEY, "1");
    } catch {}
    setShowWelcome(false);
  };

  // Auto-advance del carrusel
  useEffect(() => {
    const len = Math.max(newsItems.length, 1);
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % len);
    }, 6000);
    return () => clearInterval(interval);
  }, [newsItems.length]);

  // Carga de stats (tu lógica)
  useEffect(() => {
    const controller = new AbortController();

    async function loadStats() {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const qs = chatbotSegment
          ? `?chatbot=${encodeURIComponent(chatbotSegment)}`
          : "";
        const response = await fetch(`/api/dashboard/stats${qs}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        const payload = await response.json();
        const stats = payload?.data?.stats || {};

        setStatsData({
          activeChats:
            typeof stats.activeChats === "number" ? stats.activeChats : null,
          newLeads: typeof stats.newLeads === "number" ? stats.newLeads : null,
          conversionRate:
            typeof stats.conversionRate === "number"
              ? stats.conversionRate
              : null,
          averageResponseLabel:
            typeof stats.averageResponseLabel === "string"
              ? stats.averageResponseLabel
              : null,
          closedSales:
            typeof stats.closedSales === "number" ? stats.closedSales : null,
          activeCampaigns:
            typeof stats.activeCampaigns === "number"
              ? stats.activeCampaigns
              : null,
        });
      } catch (error) {
        const isAbortError =
          error?.name === "AbortError" ||
          (typeof DOMException !== "undefined" &&
            error instanceof DOMException &&
            error.name === "AbortError");

        if (!isAbortError) {
          console.error("Failed to load dashboard stats", error);
          setStatsError("No se pudieron cargar las estadisticas.");
          setStatsData({ ...INITIAL_STATS });
        }
      } finally {
        if (!controller.signal.aborted) setStatsLoading(false);
      }
    }

    loadStats();
    return () => controller.abort();
  }, [chatbotSegment]);

  const activeNews = newsItems[activeSlide];

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 py-4 md:py-6">
        <div className="space-y-6 px-4 lg:px-6">
          {showWelcome && (
            <Card className="relative border-primary/10 bg-gradient-to-br from-primary/10 via-background to-background">
              <button
                type="button"
                onClick={handleCloseWelcome}
                aria-label="Cerrar bienvenida"
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background/60 hover:bg-background transition"
              >
                <CloseIcon className="h-4 w-4" />
              </button>

              <CardHeader className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between p-8">
                <div className="flex-1 space-y-6">
                  <CardTitle className="text-4xl lg:text-5xl font-extrabold tracking-tight">
                    Bienvenido a EliteSeller!
                  </CardTitle>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Activa tus campañas, revisa los chats pendientes y mantente
                    al tanto de nuestras actualizaciones para seguir escalando
                    tus ventas.
                  </p>
                </div>
                <div className="w-full lg:w-1/2 lg:min-w-[600px]">
                  <div className="aspect-video overflow-hidden rounded-2xl border-2 border-primary/20 shadow-2xl">
                    <iframe
                      src="https://www.youtube.com/embed/fBaTyOcu0r8?autoplay=1&mute=1&rel=0&playsinline=1"
                      title="Bienvenida a EliteSeller"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            {/* --- Tarjeta de estadísticas (tu render actual) --- */}
            <Card>
              <CardHeader>
                <CardTitle>Estadisticas rapidas</CardTitle>
                <CardDescription>
                  Resumen de tus metricas mas recientes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {statsError ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {statsError}
                  </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {STAT_ITEMS.map((item) => {
                    let displayValue = "--";
                    if (item.key === "conversionRate") {
                      const value = statsData.conversionRate;
                      if (value !== null && value !== undefined) {
                        displayValue = `${value.toFixed(1)}%`;
                      }
                    } else if (item.key === "averageResponse") {
                      if (statsData.averageResponseLabel) {
                        displayValue = statsData.averageResponseLabel;
                      }
                    } else {
                      const rawValue = statsData[item.key];
                      if (typeof rawValue === "number") {
                        displayValue = rawValue.toLocaleString("es-ES");
                      }
                    }
                    return (
                      <div
                        key={item.key}
                        className={`rounded-lg border bg-muted/30 p-4 ${
                          statsLoading ? "animate-pulse" : ""
                        }`}
                      >
                        <p className="text-sm text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold">
                          {displayValue}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.helper}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* --- Novedades: usa newsItems del server --- */}
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Novedades</CardTitle>
                  <CardDescription>
                    Explora los anuncios destacados de esta semana.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {newsError ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {newsError}
                  </div>
                ) : null}

                {activeNews ? (
                  <>
                    <div className="overflow-hidden rounded-lg border">
                      <div className="relative h-48 w-full">
                        <img
                          src={activeNews.image}
                          alt={activeNews.imageAlt}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold">
                        {activeNews.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {activeNews.description}
                      </p>
                      <a
                        href={activeNews.href}
                        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80"
                      >
                        {activeNews.cta}
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </a>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      {newsItems.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveSlide(index)}
                          className={`h-2.5 w-2.5 rounded-full ${
                            index === activeSlide
                              ? "bg-primary"
                              : "bg-muted-foreground/30"
                          }`}
                          aria-label={`Ir a la novedad ${item.title}`}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No hay novedades disponibles.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
