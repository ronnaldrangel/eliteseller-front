
"use client"

import React, { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, ExternalLink, Wallet } from "lucide-react"
import { paymentsService } from "@/services/payments.service"

export function FlowMonitoringModal() {
    const [open, setOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("payments")
    const [loading, setLoading] = useState(false)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

    // Data States
    const [payments, setPayments] = useState([])
    const [subscriptions, setSubscriptions] = useState([])
    const [plans, setPlans] = useState([])

    useEffect(() => {
        if (open) {
            fetchData(activeTab)
        }
    }, [open, activeTab, selectedDate])

    const fetchData = async (tab) => {
        setLoading(true)
        try {
            if (tab === "payments") {
                const res = await paymentsService.getPayments(0, 20, selectedDate)
                setPayments(res.data || [])
            } else if (tab === "subscriptions") {
                // Fetch for a default plan or all? 
                // The backend getAllSubscriptions requires a planId.
                // We might need to fetch plans first to get IDs, or assume a main plan.
                // For now, let's try fetching plans first then subs for the first plan, 
                // or just fetch plans if tab is plans.
                // IF tab is subscriptions, we need a planId. 
                // Let's modify to fetch all or main ones.
                // For this MVP, let's fetch plans first to get IDs.
                const plansRes = await paymentsService.getPlans()
                setPlans(plansRes.data || [])

                // Fetch subs for the first active plan if available
                if (plansRes.data && plansRes.data.length > 0) {
                    // Fetch subs for all plans or just one? iterate?
                    // Let's fetch for the first one for now or all concurrently
                    const allSubs = []
                    for (const p of plansRes.data) {
                        try {
                            const subs = await paymentsService.getSubscriptions(p.planId)
                            if (subs) allSubs.push(...subs)
                        } catch (e) { console.warn(e) }
                    }
                    setSubscriptions(allSubs)
                }
            } else if (tab === "plans") {
                const res = await paymentsService.getPlans()
                setPlans(res.data || [])
            }
        } catch (error) {
            console.error("Error fetching flow data:", error)
        } finally {
            setLoading(false)
        }
    }

    const refreshData = () => fetchData(activeTab)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Wallet className="h-4 w-4" />
                    Monitoreo Flow
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Monitoreo Flow
                    </DialogTitle>
                    <DialogDescription>
                        Gestión de pagos y suscripciones en tiempo real.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="payments">Pagos Recientes</TabsTrigger>
                            <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
                            <TabsTrigger value="plans">Planes</TabsTrigger>
                        </TabsList>
                        <Button size="sm" variant="ghost" onClick={refreshData} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-auto border rounded-md">
                        {loading && payments.length === 0 && activeTab === 'payments' ? (
                            <div className="flex h-40 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                <TabsContent value="payments" className="m-0 h-full flex flex-col gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Fecha:</span>
                                        <input
                                            type="date"
                                            className="flex h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                        />
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>ID / Orden</TableHead>
                                                <TableHead>Cliente / Email</TableHead>
                                                <TableHead>Monto</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead>Acción</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payments.map((payment) => (
                                                <TableRow key={payment.flowOrder}>
                                                    <TableCell className="text-xs">
                                                        {new Date(payment.paymentData?.date || payment.created).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">#{payment.flowOrder}</div>
                                                        <div className="text-xs text-muted-foreground">{payment.subject}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">{payment.payer?.email || "Sin email"}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {payment.amount} {payment.currency}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={payment.status === 2 ? 'default' : 'secondary'}
                                                            className={payment.status === 2 ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                                                            {payment.status === 2 ? 'Pagado' : payment.status === 1 ? 'Pendiente' : 'Rechazado'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {/* Assuming invoice link logic or purely display */}
                                                        <Button size="sm" variant="ghost" className="h-6 gap-1" disabled>
                                                            <ExternalLink className="h-3 w-3" />
                                                            Invoice
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {payments.length === 0 && !loading && (
                                                <TableRow><TableCell colSpan={6} className="text-center h-24">No hay pagos recientes.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TabsContent>

                                <TabsContent value="subscriptions" className="m-0 h-full">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Plan</TableHead>
                                                <TableHead>Inicio</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead>Periodo</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {subscriptions.map((sub) => (
                                                <TableRow key={sub.subscriptionId}>
                                                    <TableCell className="font-medium">{sub.subscriptionId}</TableCell>
                                                    <TableCell>{sub.planId}</TableCell>
                                                    <TableCell>{new Date(sub.created).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={sub.status === 1 ? "default" : "secondary"}>
                                                            {sub.status === 1 ? "Activa" : "Inactiva"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {sub.period_interval} dias
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {subscriptions.length === 0 && !loading && (
                                                <TableRow><TableCell colSpan={5} className="text-center h-24">No hay suscripciones encontradas.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TabsContent>

                                <TabsContent value="plans" className="m-0 h-full">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Plan ID</TableHead>
                                                <TableHead>Nombre</TableHead>
                                                <TableHead>Precio</TableHead>
                                                <TableHead>Intervalo</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {plans.map((plan) => (
                                                <TableRow key={plan.planId}>
                                                    <TableCell className="font-medium">{plan.planId}</TableCell>
                                                    <TableCell>{plan.name}</TableCell>
                                                    <TableCell>{plan.amount} {plan.currency}</TableCell>
                                                    <TableCell>{plan.interval} dias</TableCell>
                                                </TableRow>
                                            ))}
                                            {plans.length === 0 && !loading && (
                                                <TableRow><TableCell colSpan={4} className="text-center h-24">No hay planes disponibles.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TabsContent>
                            </>
                        )}
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
