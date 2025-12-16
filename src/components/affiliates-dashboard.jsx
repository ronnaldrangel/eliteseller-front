"use client";

import { PiggyBank, TrendingUp, Users, Wallet, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import Image from "next/image";

export default function AffiliatesDashboard({
  affiliatePath,
  userId,
  commissionPercent = 0,
  referrals = [],
}) {
  const fullLink =
    typeof window !== "undefined"
      ? `${window.location.origin}${affiliatePath}`
      : affiliatePath;
  const canCopy = !!userId;

  // Calculations
  const totalReferrals = referrals.length;

  const totalCommission = referrals.reduce((acc, ref) => {
    const price = Number(ref.subscription?.plan?.price || 0);
    return acc + (price * commissionPercent) / 100;
  }, 0);

  const paidCommission = referrals
    .filter(
      (r) => r.referal_status === "paid" || r.referal_status === "completed"
    )
    .reduce((acc, ref) => {
      const price = Number(ref.subscription?.plan?.price || 0);
      return acc + (price * commissionPercent) / 100;
    }, 0);

  const pendingCommission = totalCommission - paidCommission;

  // Sort by date (newest first)
  const sortedReferrals = [...referrals].sort((a, b) => {
    const dateA = new Date(a.subscription_date || a.createdAt);
    const dateB = new Date(b.subscription_date || b.createdAt);
    return dateB - dateA;
  });

  const recentReferrals = sortedReferrals.slice(0, 3);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullLink);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Panel de afiliados</h1>
          <p className="text-sm text-muted-foreground">
            Resumen rápido de tu programa: rendimiento, comisiones y actividad
            reciente.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-muted">
          <CardHeader>
            <CardTitle>Tu enlace de referido</CardTitle>
            <CardDescription>
              Comparte este enlace para atribuir tus referidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-row flex-wrap gap-2 w-full">
              <div className="flex-1 min-w-[260px]">
                <Input
                  value={fullLink}
                  readOnly
                  className="font-mono text-sm"
                />
              </div>
              <div className="min-w-[140px] w-full sm:w-auto">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="w-full hover:cursor-pointer"
                  disabled={!canCopy}
                >
                  <Copy className="size-4 mr-2" />
                  Copiar enlace
                </Button>
              </div>
            </div>
            {!canCopy && (
              <p className="mt-2 text-xs text-muted-foreground">
                Activa tu enlace desde “Ver enlace / activar” para habilitar la
                copia.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-muted flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 opacity-20 w-32 h-32 rotate-12 pointer-events-none select-none">
            <Image
              src="/images/affiliates/step3.png"
              alt="Retiro"
              width={128}
              height={128}
              className="object-contain"
            />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Tu Comisión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative z-10">
              <span className="text-4xl font-bold tracking-tight">
                {commissionPercent}%
              </span>
              <p className="text-sm text-muted-foreground mt-1">
                Ganas el {commissionPercent}% de cada pago de las suscripciones
                que refieras.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-muted">
          <CardContent className="flex justify-between items-start p-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                Referidos Totales
              </span>
              <span className="text-2xl font-bold">{totalReferrals}</span>
              <p className="text-xs text-muted-foreground">
                Suscripciones generadas
              </p>
            </div>
            <div className="text-sky-600">
              <Users className="size-10" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardContent className="flex justify-between items-start p-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                Comisión Total
              </span>
              <span className="text-2xl font-bold">
                {formatCurrency(totalCommission)}
              </span>
              <p className="text-xs text-muted-foreground">
                Ingresos generados
              </p>
            </div>
            <div className="text-yellow-500">
              <Wallet className="size-10" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardContent className="flex justify-between items-start p-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                Pendiente de Pago
              </span>
              <span className="text-2xl font-bold">
                {formatCurrency(pendingCommission)}
              </span>
              <p className="text-xs text-muted-foreground">Por liberar</p>
            </div>
            <div className="text-pink-400">
              <PiggyBank className="size-10" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-muted min-w-0">
          <CardHeader>
            <CardTitle>Detalle de Referidos</CardTitle>
            <CardDescription>
              Historial completo de tus referidos y comisiones.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Fecha</TableHead>
                    <TableHead className="whitespace-nowrap">Plan</TableHead>
                    <TableHead className="whitespace-nowrap">Precio</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Comisión
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedReferrals.length > 0 ? (
                    sortedReferrals.map((ref, i) => {
                      const price = Number(ref.subscription?.plan?.price || 0);
                      const commission = (price * commissionPercent) / 100;
                      return (
                        <TableRow key={ref.id || i}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {formatDate(ref.subscription_date || ref.createdAt)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {ref.subscription?.plan?.name || "Desconocido"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatCurrency(price)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatCurrency(commission)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline">
                              {ref.referal_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-muted-foreground"
                      >
                        No tienes referidos aún.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas 3 conversiones.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentReferrals.length > 0 ? (
              recentReferrals.map((ref, i) => {
                const price = Number(ref.subscription?.plan?.price || 0);
                const commission = (price * commissionPercent) / 100;
                const statusColor =
                  ref.referal_status === "paid" ||
                    ref.referal_status === "completed"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

                return (
                  <div
                    key={ref.id || i}
                    className="flex items-center justify-between rounded-lg border border-muted/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {formatCurrency(commission)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(ref.subscription_date || ref.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor}`}
                      >
                        {ref.referal_status}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin actividad reciente.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
