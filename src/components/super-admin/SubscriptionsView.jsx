"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analyticsService } from "@/services/analytics.service";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_MAP = {
  1: {
    label: "Activo",
    className: "text-green-600 border-green-200 bg-green-50",
  },
  2: {
    label: "Prueba",
    className: "text-purple-600 border-purple-200 bg-purple-50",
  },
  3: {
    label: "Inactivo",
    className: "text-amber-600 border-amber-200 bg-amber-50",
  },
  4: {
    label: "Cancelado",
    className: "text-red-600 border-red-200 bg-red-50",
  },
};

export function SubscriptionsView() {
  const [planData, setPlanData] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const [start, setStart] = useState(0);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchPlanData = async () => {
      try {
        const plans = await analyticsService.getPlanUsage();
        setPlanData(plans);
        const planIds = Object.keys(plans || {});
        if (planIds.length > 0) {
          setSelectedPlanId(planIds[0]);
        }
      } catch (error) {
        console.error("Error fetching plan data:", error);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlanData();
  }, []);

  useEffect(() => {
    if (!selectedPlanId) return;

    const fetchSubs = async () => {
      setLoadingSubs(true);
      try {
        const res = await analyticsService.getSubscriptionsByPlan(
          selectedPlanId,
          start,
          limit
        );
        setSubscriptions(res.data || []);
        setHasMore(res.hasMore);
        setTotal(res.total);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
        setSubscriptions([]);
        setTotal(0);
        setHasMore(false);
      } finally {
        setLoadingSubs(false);
      }
    };

    fetchSubs();
  }, [selectedPlanId, start, limit]);

  const handlePlanSelect = (planId) => {
    if (planId === selectedPlanId) return;
    setSelectedPlanId(planId);
    setStart(0);
    setSubscriptions([]);
  };

  const handleNext = () => {
    if (hasMore) {
      setStart((prev) => prev + limit);
    }
  };

  const handlePrev = () => {
    setStart((prev) => Math.max(0, prev - limit));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Suscripciones</h2>
        <p className="text-muted-foreground">
          Administra y analiza los planes de suscripción.
        </p>
      </div>

      <div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Planes</CardTitle>
            <CardDescription>
              Selecciona un plan para ver sus suscripciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loadingPlans ? (
                <Loader2 className="animate-spin text-primary" />
              ) : !planData ? (
                <p>No se encontraron planes</p>
              ) : (
                Object.entries(planData).map(([planId, details]) => {
                  const isSelected = selectedPlanId === planId;
                  let dotClass = "bg-primary";
                  if (planId === "BASICO") dotClass = "bg-slate-400";
                  if (planId === "GALACTICO") dotClass = "bg-purple-500";

                  return (
                    <div
                      key={planId}
                      onClick={() => handlePlanSelect(planId)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors border ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "bg-card border-transparent hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${dotClass}`} />
                        <span className="font-medium capitalize">
                          {planId.toLowerCase()}
                        </span>
                      </div>
                      <span className="font-bold text-sm">
                        {details.percentage}%
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
      <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center py-4">
             <div className="text-sm text-muted-foreground">
                <span className="font-medium">Plan:</span> {selectedPlanId || "..."} ({total} total)
             </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-2">
                {start + 1}-{Math.min(start + limit, total)} de {total}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={start === 0 || loadingSubs}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Atras
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={!hasMore || loadingSubs}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
          
          <div className="rounded-2xl border shadow-sm overflow-hidden">
            {loadingSubs ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : subscriptions.length === 0 ? (
              <p className="text-center text-muted-foreground p-8">
                No se encontraron suscripciones para este plan.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Fin</TableHead>
                    <TableHead>Prox. Factura</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => {
                    const statusInfo = STATUS_MAP[sub.status] || {
                      label: "Unknown",
                      variant: "outline",
                    };
                    return (
                      <TableRow key={sub.subscriptionId}>
                        <TableCell>
                          <div className="font-medium">
                            {sub.name || "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {sub.customerId}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(sub.subscription_start)}
                        </TableCell>
                        <TableCell>{formatDate(sub.period_end)}</TableCell>
                        <TableCell>
                          {formatDate(sub.next_invoice_date)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`rounded-lg ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
      </div>
      </div>
    </div>
  );
}
