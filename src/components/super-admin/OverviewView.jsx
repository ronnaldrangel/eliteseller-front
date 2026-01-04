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
    { id: "90d", label: "Last 3 months" },
    { id: "30d", label: "Last 30 days" },
    { id: "14d", label: "Last 14 days" },
    { id: "7d", label: "Last 7 days" },
];

export function OverviewView() {
    const [showNewSubs, setShowNewSubs] = useState(false);
    const [chartRange, setChartRange] = useState("90d");
    
    // Data States
    const [revenueData, setRevenueData] = useState(null);
    const [churnData, setChurnData] = useState(null);
    const [ltvData, setLtvData] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [revenue, churn, ltv] = await Promise.all([
                    analyticsService.getMonthlyRevenue(),
                    analyticsService.getChurnMetrics(),
                    analyticsService.getLtvMetrics(),
                ]);
                setRevenueData(revenue);
                setChurnData(churn);
                setLtvData(ltv);
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
        if (loading || !revenueData || !churnData) return [
            { title: "Monthly Revenue", value: "Loading...", change: "...", trend: "neutral", icon: DollarSign, color: "text-muted-foreground" },
            { title: "Avg LTV per User", value: "Loading...", change: "...", trend: "neutral", icon: Users, color: "text-blue-500" },
            { title: "Churn Rate", value: "Loading...", change: "...", trend: "neutral", icon: UserMinus, color: "text-muted-foreground" },
            { title: "Retention Rate", value: "Loading...", change: "...", trend: "neutral", icon: Activity, color: "text-muted-foreground" },
        ];

        return [
            {
                title: "Monthly Revenue",
                value: `$${revenueData.lastThirtyDaysRevenue.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                change: `${revenueData.comparison.isPositiveChange ? '+' : ''}${revenueData.comparison.value.toFixed(1)}% vs last month`,
                trend: revenueData.comparison.trend,
                icon: DollarSign,
                color: "text-green-500",
            },
            {
                title: "Avg LTV per User",
                value: ltvData ? `$${ltvData.ltv.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00",
                change: ltvData ? `${ltvData.comparison.isPositiveChange ? '+' : ''}${ltvData.comparison.value.toFixed(1)}% vs last month` : "...",
                trend: ltvData ? ltvData.comparison.trend : "neutral",
                icon: Users,
                color: "text-blue-500",
            },
            {
                title: "Churn Rate",
                value: `${churnData.currentChurn.toFixed(2)}%`,
                change: `${churnData.comparison.churnRate.isPositiveChange ? '' : '-'} vs previous`,
                trend: churnData.comparison.churnRate.trend,
                icon: UserMinus,
                color: "text-red-500",
            },
            {
                title: "Retention Rate",
                value: `${churnData.currentRetention.toFixed(2)}%`,
                change: `vs previous`,
                trend: churnData.comparison.retentionRate.trend,
                icon: Activity,
                color: "text-purple-500",
            },
        ];
    }, [revenueData, churnData, ltvData, loading]);

    const chartConfig = {
        total: {
            label: "Total Revenue",
            color: "hsl(var(--primary))",
        },
        newSubs: {
            label: "New Subs Revenue",
            color: "#10b981",
        },
    }

    const chartGradientId = "revenueAreaGradient";

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                    <p className="text-muted-foreground">
                        Platform performance metrics.
                    </p>
                </div>
                 <Button
                    variant={showNewSubs ? "default" : "outline"}
                    onClick={() => setShowNewSubs(!showNewSubs)}
                    className="flex w-fit"
                >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    {showNewSubs ? "Show Total Revenue" : "Show New Subs Revenue"}
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
                                    {metric.trend === 'up' ? "Trending Up" : metric.trend === 'down' ? "Trending Down" : "Stable"}
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
                            {showNewSubs ? "New Subscriptions Revenue" : "Revenue Overview"}
                        </CardTitle>
                        <CardDescription>
                            {showNewSubs ? "Revenue from new subscriptions." : "Revenue performance over time."}
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
