"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    Tooltip,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
    Users,
    DollarSign,
    Activity,
    UserMinus,
    TrendingUp,
    TrendingDown,
    Minus,
} from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { analyticsService } from "@/services/analytics.service"

const CHART_RANGE_OPTIONS = [
    { id: "90d", label: "Últimos 3 meses" },
    { id: "30d", label: "Últimos 30 días" },
    { id: "14d", label: "Últimos 14 días" },
    { id: "7d", label: "Últimos 7 días" },
];

export function OverviewView() {
    const [showNewSubs, setShowNewSubs] = useState(false);
    const [chartRange, setChartRange] = useState("90d");
    
    // Data States
    const [revenueData, setRevenueData] = useState(null);
    const [countsData, setCountsData] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [revenue, counts] = await Promise.all([
                    analyticsService.getMonthlyRevenue(),
                    analyticsService.getDashboardCounts(),
                ]);
                setRevenueData(revenue);
                setCountsData(counts);
            } catch (error) {
                console.error("Error fetching admin dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchChart = async () => {
            try {
                const data = await analyticsService.getRevenueChart(chartRange);
                const formatted = data.map(item => ({
                    name: item.date,
                    total: Number(item.revenue),
                    newSubs: Number(item.netRevenue)
                }));
                setChartData(formatted);
            } catch (error) {
                console.error("Error fetching chart data:", error);
            }
        };
        fetchChart();
    }, [chartRange]);

    const adminMetrics = useMemo(() => {
        if (loading || !revenueData || !countsData) return [
            { title: "Monthly Revenue", value: "Loading...", change: "...", trend: "neutral", icon: DollarSign, color: "text-muted-foreground" },
            { title: "Total Users", value: "Loading...", change: "...", trend: "neutral", icon: Users, color: "text-blue-500" },
            { title: "Active Chatbots", value: "Loading...", change: "...", trend: "neutral", icon: UserMinus, color: "text-muted-foreground" },
            { title: "Total Subscriptions", value: "Loading...", change: "...", trend: "neutral", icon: Activity, color: "text-muted-foreground" },
        ];

        return [
            {
                title: "Ingresos Mensuales",
                value: `$${revenueData.lastThirtyDaysRevenue.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                change: `${revenueData.comparison.isPositiveChange ? '+' : ''}${revenueData.comparison.value.toFixed(1)}% vs mes anterior`,
                trend: revenueData.comparison.trend,
                icon: DollarSign,
                color: "text-green-500",
            },
            {
                title: "Total Usuarios",
                value: countsData.users.toLocaleString(),
                change: "Usuarios Activos",
                trend: "neutral",
                icon: Users,
                color: "text-blue-500",
            },
            {
                title: "Chatbots Activos",
                value: countsData.chatbots.toLocaleString(),
                change: "Total Creados",
                trend: "neutral",
                icon: UserMinus,
                color: "text-purple-500",
            },
            {
                title: "Total Suscripciones",
                value: countsData.subscriptions.toLocaleString(),
                change: "Planes Activos",
                trend: "neutral",
                icon: Activity,
                color: "text-orange-500",
            },
        ];
    }, [revenueData, countsData, loading]);

    const chartConfig = {
        total: {
            label: "Ingresos Totales",
            color: "hsl(var(--primary))",
        },
        newSubs: {
            label: "Ingresos Nuevas Subs",
            color: "#10b981",
        },
    }

    const chartGradientId = "revenueAreaGradient";

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Resumen</h2>
                    <p className="text-muted-foreground">
                        Métricas de rendimiento de la plataforma.
                    </p>
                </div>
                 <Button
                    variant={showNewSubs ? "default" : "outline"}
                    onClick={() => setShowNewSubs(!showNewSubs)}
                    className="flex w-fit"
                >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    {showNewSubs ? "Ver Ingresos Totales" : "Ver Ingresos Nuevas Subs."}
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {adminMetrics.map((metric, index) => {
                    const TrendIcon = metric.trend === "up" ? TrendingUp : metric.trend === "down" ? TrendingDown : Minus;
                    return (
                        <Card key={index} className="@container/card overflow-hidden rounded-3xl bg-gradient-to-t from-primary/5 via-card to-card dark:bg-card">
                            <CardHeader className="relative">
                                <CardDescription className="text-sm font-medium">
                                    {metric.title}
                                </CardDescription>
                                <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                                    {metric.value}
                                </CardTitle>
                                <div className="absolute right-4 top-4">
                                    <Badge variant="outline" className="flex gap-1 rounded-xl border-border/60 text-xs text-foreground">
                                        <TrendIcon className="h-3 w-3" />
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1 text-sm">
                                <div className="line-clamp-1 flex gap-2 font-medium">
                                    {metric.trend === 'up' ? "Tendencia Alza" : metric.trend === 'down' ? "Tendencia Baja" : "Estable"}
                                    <TrendIcon className="h-4 w-4" />
                                </div>
                                <div className="text-muted-foreground">{metric.change}</div>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>

            <Card className="@container/card overflow-hidden rounded-[2rem]">
                <CardHeader className="gap-2 pb-2">
                    <div>
                        <CardTitle className="mb-2">
                            {showNewSubs ? "Ingresos Nuevas Suscripciones" : "Resumen de Ingresos"}
                        </CardTitle>
                        <CardDescription>
                            {showNewSubs ? "Ingresos de nuevas suscripciones." : "Rendimiento de ingresos en el tiempo."}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 px-6 pb-6">
                    <div className="h-48 sm:h-64">
                         <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id={chartGradientId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={showNewSubs ? "#10b981" : "#6d8df6"} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={showNewSubs ? "#10b981" : "#6d8df6"} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    minTickGap={32}
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                    }}
                                />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Area
                                    type="monotone"
                                    dataKey={showNewSubs ? "newSubs" : "total"}
                                    stroke={showNewSubs ? "#10b981" : "hsl(var(--primary))"}
                                    fill={`url(#${chartGradientId})`}
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </div>
                </CardContent>
                <CardFooter className="px-6 pb-6">
                    <ToggleGroup
                        type="single"
                        value={chartRange}
                        onValueChange={(value) => value && setChartRange(value)}
                        variant="outline"
                        className="flex w-full flex-wrap gap-2"
                    >
                        {CHART_RANGE_OPTIONS.map((option) => (
                            <ToggleGroupItem
                                key={option.id}
                                value={option.id}
                                className="h-9 flex-1 sm:flex-none sm:px-4 rounded-xl"
                            >
                                {option.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </CardFooter>
            </Card>
        </div>
    )
}
