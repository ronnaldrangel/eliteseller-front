"use client"

import React, { useState, useMemo } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
    Users,
    DollarSign,
    Activity,
    UserMinus,
    Search,
    Filter,
    Download,
    TrendingUp,
    TrendingDown,
    Minus,
    ArrowRight,
    List,
    UserCheck,
    UserX,
    Calendar,
    ChevronRight
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group"


const adminMetrics = [
    {
        title: "Monthly Revenue",
        value: "$45,231.89",
        change: "+20.1% from last month",
        trend: "up",
        icon: DollarSign,
        color: "text-green-500",
    },
    {
        title: "Avg LTV per User",
        value: "$1,250.00",
        change: "+4.5% from last month",
        trend: "up",
        icon: Users,
        color: "text-blue-500",
    },
    {
        title: "Churn Rate",
        value: "2.4%",
        change: "-0.5% from last month",
        trend: "down", // Good for churn
        icon: UserMinus,
        color: "text-red-500",
    },
    {
        title: "Retention Rate",
        value: "97.6%",
        change: "+0.5% from last month",
        trend: "up",
        icon: Activity,
        color: "text-purple-500",
    },
]

// Extended Mock Data for filtering simulation
const fullRevenueData = [
    // 90 days worth of weekly-like chunks or monthly for simplicity in this mock
    { name: "Week 1", total: 3500, newSubs: 500 },
    { name: "Week 2", total: 3800, newSubs: 600 },
    { name: "Week 3", total: 4200, newSubs: 700 }, // ~ last 30d starts around here if we go backwards
    { name: "Week 4", total: 3500, newSubs: 200 },
    { name: "Week 5", total: 8000, newSubs: 1200 },
    { name: "Week 6", total: 9500, newSubs: 1400 },
    { name: "Week 7", total: 11000, newSubs: 1600 },
    { name: "Week 8", total: 10500, newSubs: 1500 }, // ~ last 14d
    { name: "Week 9", total: 12000, newSubs: 1800 },
    { name: "Week 10", total: 11500, newSubs: 1700 }, // ~ last 7d
    { name: "Week 11", total: 13000, newSubs: 2000 },
    { name: "Week 12", total: 14000, newSubs: 2200 },
]

// To make it feel real, we map 'days' to slices of the array
const CHART_RANGE_OPTIONS = [
    { id: "90d", label: "Last 3 months" },
    { id: "30d", label: "Last 30 days" },
    { id: "14d", label: "Last 14 days" },
    { id: "7d", label: "Last 7 days" },
];

const recentUsers = [
    {
        id: "USR-001",
        name: "Alice Johnson",
        email: "alice@example.com",
        plan: "Pro",
        status: "Active",
        joined: "2024-01-15",
        amount: "$29.00",
    },
    {
        id: "USR-002",
        name: "Bob Smith",
        email: "bob@example.com",
        plan: "Enterprise",
        status: "Active",
        joined: "2024-02-20",
        amount: "$99.00",
    },
    {
        id: "USR-003",
        name: "Charlie Brown",
        email: "charlie@example.com",
        plan: "Basic",
        status: "Cancelled",
        joined: "2024-03-10",
        amount: "$9.00",
    },
    {
        id: "USR-004",
        name: "Diana Prince",
        email: "diana@example.com",
        plan: "Pro",
        status: "Active",
        joined: "2024-04-05",
        amount: "$29.00",
    },
    {
        id: "USR-005",
        name: "Evan Wright",
        email: "evan@example.com",
        plan: "Enterprise",
        status: "Active",
        joined: "2024-05-12",
        amount: "$99.00",
    },
    {
        id: "USR-006",
        name: "Fiona Gallagher",
        email: "fiona@example.com",
        plan: "Basic",
        status: "Active",
        joined: "2024-06-18",
        amount: "$9.00",
    },
    {
        id: "USR-007",
        name: "George Martin",
        email: "george@example.com",
        plan: "Pro",
        status: "Active",
        joined: "2025-01-05", // Very recent
        amount: "$29.00",
    },
    {
        id: "USR-008",
        name: "Hannah Lee",
        email: "hannah@example.com",
        plan: "Pro",
        status: "Active",
        joined: "2025-01-07", // Very recent
        amount: "$29.00",
    },
]

export default function SuperAdminDashboard() {
    const [showNewSubs, setShowNewSubs] = useState(false);
    const [chartRange, setChartRange] = useState("90d");
    const [userFilter, setUserFilter] = useState("all"); // 'all', '7d', '30d'

    // Filter data based on range
    const filteredData = useMemo(() => {
        let count = 12; // default 90d (all)
        if (chartRange === '30d') count = 5;
        if (chartRange === '14d') count = 3;
        if (chartRange === '7d') count = 2; // minimalist mock data
        return fullRevenueData.slice(fullRevenueData.length - count);
    }, [chartRange]);

    const filteredUsers = useMemo(() => {
        if (userFilter === 'all') return recentUsers;
        // Mock filtering logic assuming "today" is approx Jan 2025 for mocking purposes or just taking last N items
        if (userFilter === '7d') return recentUsers.slice(-2); // Mocking "recent"
        if (userFilter === '30d') return recentUsers.slice(-4);
        return recentUsers;
    }, [userFilter]);

    // Config for ChartContainer
    const chartConfig = {
        total: {
            label: "Total Revenue",
            color: "hsl(var(--primary))",
        },
        newSubs: {
            label: "New Subs Revenue",
            color: "#10b981", // Emerald 500
        },
    }

    const chartGradientId = "revenueAreaGradient";

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40 p-4 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Super Admin</h1>
                    <p className="text-muted-foreground">
                        Overview of platform performance and user management.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={showNewSubs ? "default" : "outline"}
                        onClick={() => setShowNewSubs(!showNewSubs)}
                        className="flex"
                    >
                        <TrendingUp className="mr-2 h-4 w-4" />
                        {showNewSubs ? "Show Total Revenue" : "Show New Subs Revenue"}
                    </Button>
                    <Button variant="outline" className="hidden sm:flex">
                        <Download className="mr-2 h-4 w-4" />
                        Export Data
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {adminMetrics.map((metric, index) => {
                    const TrendIcon =
                        metric.trend === "up"
                            ? TrendingUp
                            : metric.trend === "down"
                                ? TrendingDown
                                : Minus;

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
                                    <Badge
                                        variant="outline"
                                        className="flex gap-1 rounded-xl border-border/60 text-xs text-foreground"
                                    >
                                        <TrendIcon className="h-3 w-3" />
                                        {metric.change.split(' ')[0]}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1 text-sm">
                                <div className="line-clamp-1 flex gap-2 font-medium">
                                    {metric.trend === 'up' ? "Trending Up" : "Trending Down"}
                                    <TrendIcon className="h-4 w-4" />
                                </div>
                                <div className="text-muted-foreground">{metric.change}</div>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr] mb-8">
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
                                <AreaChart data={filteredData}>
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

                <Card className="@container/card overflow-hidden rounded-[2rem] flex flex-col">
                    <CardHeader>
                        <CardTitle>Subscription Distribution</CardTitle>
                        <CardDescription>
                            User breakdown by plan type.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-6 w-full">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-primary" />
                                        <span className="font-medium">Enterprise</span>
                                    </div>
                                    <span className="font-bold">15%</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                        <span className="font-medium">Pro</span>
                                    </div>
                                    <span className="font-bold">45%</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-300/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-slate-400" />
                                        <span className="font-medium">Basic</span>
                                    </div>
                                    <span className="font-bold">40%</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-center pb-8">
                <Sheet>
                    <SheetTrigger asChild>
                        <Card className="w-full cursor-pointer hover:bg-muted/50 transition-all rounded-[2rem] border-dashed border-2">
                            <CardContent className="flex items-center justify-between p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-full">
                                        <Users className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold">User Database</h3>
                                        <p className="text-muted-foreground">View and manage all registered users</p>
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" className="rounded-full h-12 w-12">
                                    <ChevronRight className="h-6 w-6" />
                                </Button>
                            </CardContent>
                        </Card>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[90vh] sm:h-[85vh] rounded-t-[2rem]">
                        <SheetHeader className="mb-6">
                            <SheetTitle className="text-2xl flex items-center gap-2">
                                <Users className="h-6 w-6" />
                                Gestión de Usuarios
                            </SheetTitle>
                            <SheetDescription>
                                Lista completa de usuarios registrados. Utiliza los filtros para refinar la busqueda.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="flex flex-col gap-4 h-full pb-10">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                <ToggleGroup type="single" value={userFilter} onValueChange={(val) => val && setUserFilter(val)} variant="outline">
                                    <ToggleGroupItem value="all" className="rounded-xl px-4">All Users</ToggleGroupItem>
                                    <ToggleGroupItem value="30d" className="rounded-xl px-4">New (30d)</ToggleGroupItem>
                                    <ToggleGroupItem value="7d" className="rounded-xl px-4">New (7d)</ToggleGroupItem>
                                </ToggleGroup>

                                <div className="flex gap-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-64">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Buscar por nombre o email..." className="pl-8 rounded-xl" />
                                    </div>
                                    <Button variant="outline" size="icon" className="rounded-xl">
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto border rounded-2xl shadow-sm">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>User ID</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead className="hidden md:table-cell">Email</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="hidden md:table-cell">Joined</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.id}</TableCell>
                                                <TableCell>{user.name}</TableCell>
                                                <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={user.plan === "Enterprise" ? "default" : "secondary"} className="rounded-lg">
                                                        {user.plan}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`rounded-lg ${user.status === "Active" ? "text-green-600 border-green-200 bg-green-50" : "text-red-600 border-red-200 bg-red-50"
                                                        }`}>
                                                        {user.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">{user.joined}</TableCell>
                                                <TableCell className="text-right font-medium">{user.amount}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center">
                                                    No users found for this filter.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    )
}
