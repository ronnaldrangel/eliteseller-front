"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  ArrowRight,
  Minus,
  TrendingDown,
  TrendingUp,
  X as CloseIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import Link from "next/link";

const STAT_ITEMS = [
  {
    key: "contacts",
    label: "Contactos",
    helper: "Contactos totales registrados",
    baseline: 120,
    positiveSummary: "Alza en contactos",
    positiveContext: "Las campañas de captación están funcionando.",
    negativeSummary: "Menos contactos",
    negativeContext: "Activa nuevos formularios o anuncios.",
  },
  {
    key: "triggers",
    label: "Disparadores",
    helper: "Automatizaciones activas",
    baseline: 18,
    positiveSummary: "Automatización saludable",
    positiveContext: "Tus flujos están cubriendo la demanda.",
    negativeSummary: "Activa más flujos",
    negativeContext: "Revisa disparadores deshabilitados.",
  },
  {
    key: "products",
    label: "Productos",
    helper: "Productos publicados",
    baseline: 40,
    positiveSummary: "Catálogo robusto",
    positiveContext: "Suficientes opciones para tus clientes.",
    negativeSummary: "Amplía el catálogo",
    negativeContext: "Carga nuevos productos destacados.",
  },
];

const INITIAL_STATS = {
  contacts: null,
  triggers: null,
  products: null,
};

// Caché en memoria con TTL de 5 minutos
const statsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const CHART_RANGE_OPTIONS = [
  { id: "90d", label: "Hace 3 meses" },
  { id: "30d", label: "Hace 30 dias" },
  { id: "7d", label: "Hace 7 dias" },
];

const RANGE_LIMIT_DAYS = {
  "90d": 90,
  "30d": 30,
  "7d": 7,
};

function formatThousands(value) {
  const raw = typeof value === "bigint" ? value.toString() : String(value ?? "0");
  const neg = raw.startsWith("-");
  const digits = neg ? raw.slice(1) : raw;
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return neg ? `-${formatted}` : formatted;
}

function tokensToMessages(tokens) {
  if (tokens === null || tokens === undefined) return null;
  try {
    return BigInt(String(tokens)) / 1000n;
  } catch {
    return null;
  }
}

function formatMessageCount(tokens) {
  const value = tokensToMessages(tokens);
  if (value === null) return "--";
  return formatThousands(value);
}

function getTrendDescriptor(item, value) {
  if (typeof value !== "number") {
    return {
      direction: "neutral",
      deltaLabel: "--",
      summary: "Sin datos",
      context: "Aun no hay registros suficientes.",
    };
  }

  const baseline = item.baseline || Math.max(value, 1);
  const delta = baseline ? ((value - baseline) / baseline) * 100 : 0;
  const absDelta = Math.abs(delta);
  const direction =
    absDelta < 1 ? "neutral" : delta > 0 ? "up" : "down";

  if (direction === "neutral") {
    return {
      direction,
      deltaLabel: "0%",
      summary: "Estable",
      context: "Mantiene el mismo rendimiento.",
    };
  }

  const isUp = direction === "up";
  return {
    direction,
    deltaLabel: `${isUp ? "+" : ""}${delta.toFixed(1)}%`,
    summary: isUp ? item.positiveSummary : item.negativeSummary,
    context: isUp ? item.positiveContext : item.negativeContext,
  };
}

function formatShortDate(date) {
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
}

export default function DocsPageClient({
  initialNewsItems = [],
  newsError,
  messageStats = { tokensRemaining: null, tokensUsed: null },
  friendlyChatbotName = "",
}) {
  const params = useParams();
  const chatbotSegmentParam = params?.chatbot;
  const chatbotSegment = useMemo(() => {
    if (!chatbotSegmentParam) return undefined;
    return Array.isArray(chatbotSegmentParam)
      ? chatbotSegmentParam[0]
      : String(chatbotSegmentParam);
  }, [chatbotSegmentParam]);
  const remainingMessages = useMemo(
    () => formatMessageCount(messageStats?.tokensRemaining),
    [messageStats]
  );
  const usedMessages = useMemo(
    () => formatMessageCount(messageStats?.tokensUsed),
    [messageStats]
  );
  const batteryHref = chatbotSegment
    ? `/dashboard/${encodeURIComponent(chatbotSegment)}/battery`
    : null;

  // Novedades recibidas del server
  const [newsItems, setNewsItems] = useState(
    Array.isArray(initialNewsItems) ? initialNewsItems : []
  );
  const [activeSlide, setActiveSlide] = useState(0);

  // Stats
  const [statsData, setStatsData] = useState({ ...INITIAL_STATS });
  const [contactSeries, setContactSeries] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [chartRange, setChartRange] = useState("30d");
  const [loadingProgress, setLoadingProgress] = useState(0);

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
    } catch { }
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

  // Carga de stats con caché
  useEffect(() => {
    const controller = new AbortController();

    async function loadStats() {
      setStatsLoading(true);
      setStatsError(null);
      setLoadingProgress(10);

      try {
        const cacheKey = `stats:${chatbotSegment || 'global'}`;
        const cached = statsCache.get(cacheKey);

        // Verificar si hay datos en caché válidos
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
          setStatsData(cached.stats);
          setContactSeries(cached.series);
          setLoadingProgress(100);
          setStatsLoading(false);
          return;
        }

        setLoadingProgress(30);
        const qs = chatbotSegment
          ? `?chatbot=${encodeURIComponent(chatbotSegment)}`
          : "";
        const response = await fetch(`/api/dashboard/stats${qs}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        setLoadingProgress(70);
        const payload = await response.json();
        const stats = payload?.data?.stats || {};
        const series = Array.isArray(payload?.data?.contactSeries)
          ? payload.data.contactSeries
          : [];

        const statsResult = {
          contacts:
            typeof stats.contacts === "number" ? stats.contacts : null,
          triggers:
            typeof stats.triggers === "number" ? stats.triggers : null,
          products:
            typeof stats.products === "number" ? stats.products : null,
        };

        // Guardar en caché
        statsCache.set(cacheKey, {
          stats: statsResult,
          series,
          timestamp: Date.now(),
        });

        setStatsData(statsResult);
        setContactSeries(series);
        setLoadingProgress(100);
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
          setContactSeries([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setStatsLoading(false);
          setLoadingProgress(0);
        }
      }
    }

    loadStats();
    return () => controller.abort();
  }, [chatbotSegment]);

  const activeNews = newsItems[activeSlide];
  const chartGradientId = useMemo(
    () => `dashboardAreaGradient-${chartRange}`,
    [chartRange]
  );
  const chartData = useMemo(() => {
    if (!Array.isArray(contactSeries) || contactSeries.length === 0) {
      return [];
    }

    const limitDays = RANGE_LIMIT_DAYS[chartRange] || 30;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (limitDays - 1));

    const buckets = new Map();
    contactSeries.forEach((point) => {
      if (!point?.date) return;
      const count =
        typeof point?.count === "number" ? point.count : Number(point?.count) || 0;
      buckets.set(point.date, count);
    });

    const filled = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const current = new Date(cursor);
      const iso = current.toISOString().split("T")[0];
      const value = buckets.get(iso) ?? 0;
      filled.push({
        date: formatShortDate(current),
        value,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return filled;
  }, [chartRange, contactSeries]);

  const chartSummary = useMemo(() => {
    if (!chartData.length) {
      return { total: 0, average: 0 };
    }
    const total = chartData.reduce((sum, point) => sum + point.value, 0);
    return {
      total,
      average: Math.round(total / chartData.length),
    };
  }, [chartData]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 py-4 md:py-6">
        <div className="space-y-6 px-4 lg:px-6">
          {/* {showWelcome && (
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
                        src="https://www.youtube.com/embed/fBaTyOcu0r8?autoplay=1&mute=1&rel=0&playsinline=1&controls=0&loop=1&playlist=fBaTyOcu0r8"
                        title="Bienvenida a EliteSeller"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )} */}

          <div className="flex flex-col gap-6">
            <div className="@xl/main:grid-cols-4 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-0 sm:grid-cols-2 sm:px-4 lg:px-0">
              {statsError ? (
                <div className="col-span-full rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {statsError}
                </div>
              ) : null}
              {statsLoading ? (
                [...STAT_ITEMS, { key: "messages" }].map((item, idx) => (
                  <Card
                    key={item.key || idx}
                    className="@container/card overflow-hidden rounded-3xl bg-gradient-to-t from-primary/5 via-card to-card dark:bg-card animate-pulse"
                  >
                    <CardHeader className="relative">
                      <CardDescription className="h-4 w-24 bg-muted rounded" />
                      <div className="h-8 w-20 bg-muted rounded mt-2"></div>
                      <div className="absolute right-4 top-4">
                        <div className="h-6 w-16 bg-muted rounded-xl"></div>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1 text-sm">
                      <div className="h-4 w-32 bg-muted rounded"></div>
                      <div className="h-4 w-full bg-muted rounded"></div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <>
                  {STAT_ITEMS.map((item) => {
                    const rawValue = statsData[item.key];
                    const displayValue =
                      typeof rawValue === "number"
                        ? rawValue.toLocaleString("es-ES")
                        : "--";
                    const trend = getTrendDescriptor(item, rawValue);
                    const TrendIcon =
                      trend.direction === "up"
                        ? TrendingUp
                        : trend.direction === "down"
                          ? TrendingDown
                          : Minus;
                    return (
                      <Card
                        key={item.key}
                        data-slot="card"
                        className="@container/card overflow-hidden rounded-3xl bg-gradient-to-t from-primary/5 via-card to-card dark:bg-card"
                      >
                        <CardHeader className="relative">
                          <CardDescription className="text-sm font-medium">
                            {item.label}
                          </CardDescription>
                          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                            {displayValue}
                          </CardTitle>
                          <div className="absolute right-4 top-4">
                            <Badge
                              variant="outline"
                              className="flex gap-1 rounded-xl border-border/60 text-xs text-foreground"
                            >
                              <TrendIcon className="h-3 w-3" />
                              {trend.deltaLabel}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1 text-sm">
                          <div className="line-clamp-1 flex gap-2 font-medium">
                            {trend.summary}
                            <TrendIcon className="h-4 w-4" />
                          </div>
                          <div className="text-muted-foreground">{trend.context}</div>
                        </CardFooter>
                      </Card>
                    );
                  })}

                  <Card className="@container/card overflow-hidden rounded-3xl bg-gradient-to-t from-primary/5 via-card to-card dark:bg-card">
                    <CardHeader className="relative">
                      <CardDescription className="text-sm font-medium flex items-center gap-2">
                        Tienes bateria para enviar
                      </CardDescription>
                      <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                        {remainingMessages}
                      </CardTitle>
                      <div className="absolute right-4 top-4">
                        <Badge
                          variant="outline"
                          className="flex gap-1 rounded-xl border-border/60 text-xs text-foreground"
                        >
                          {batteryHref ? "Mensajes" : "Saldo"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1 text-sm">
                      <div className="font-medium">
                        Enviaste {usedMessages === "--" ? "--" : `${usedMessages} mensajes`}
                      </div>
                      {batteryHref ? (
                        <Link
                          href={batteryHref}
                          className="text-sm font-medium text-primary hover:text-primary/80"
                        >
                          ¿Quieres aumentar tu limite? Clic aquí
                        </Link>
                      ) : null}
                    </CardFooter>
                  </Card>
                </>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <Card className="@container/card overflow-hidden rounded-[2rem]">
                <CardHeader className="gap-2 pb-2">
                  <div>
                    <CardTitle className="mb-2">Total de contactos</CardTitle>
                    <CardDescription>
                      Contactos captados en este periodo.
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 px-6 pb-6">
                  <div className="h-48 sm:h-64">
                    {chartData.length ? (
                      <ChartContainer config={{ contacts: { label: "Contactos" } }} className="aspect-auto h-full w-full">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id={chartGradientId} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6d8df6" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#6d8df6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                          />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                          <Area
                            type="monotone"
                            dataKey="value"
                            fill={`url(#${chartGradientId})`}
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                          />
                        </AreaChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Aun no hay actividad para graficar.
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="px-6 pb-6">
                  <ToggleGroup
                    type="single"
                    value={chartRange}
                    onValueChange={(value) => value && setChartRange(value)}
                    variant="outline"
                    className="flex w-full flex-wrap"
                  >
                    {CHART_RANGE_OPTIONS.map((option) => (
                      <ToggleGroupItem
                        key={option.id}
                        value={option.id}
                        className="h-9 flex-1 sm:flex-none sm:px-4"
                      >
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </CardFooter>

              </Card>

              <Card className="flex h-full flex-col gap-4">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="mb-2">Novedades</CardTitle>
                    <CardDescription>
                      Nuevas noticias sobre EliteSeller de la semana.
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
                      <div className="overflow-hidden rounded-2xl shadow-md">
                        <div className="relative h-40 w-full sm:h-48">
                          <img
                            src={activeNews.image ? activeNews.image : null}
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
                            className={`h-2.5 w-2.5 rounded-full ${index === activeSlide
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
                      Esperando nuevas noticias!.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
