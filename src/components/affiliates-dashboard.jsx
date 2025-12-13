"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  PiggyBank,
  TrendingUp,
  Users,
  Wallet,
  Copy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

const STATS = [
  { title: "Afiliados activos", value: "128", helper: "+12 este mes", icon: Users },
  { title: "Balance disponible", value: "$2,430", helper: "Listo para retirar", icon: Wallet },
  { title: "Pendiente de pago", value: "$680", helper: "Próximo corte 30 dic", icon: PiggyBank },
  { title: "Crecimiento", value: "18%", helper: "vs. último mes", icon: TrendingUp },
];

const PAYOUTS = [
  { id: "P-4311", amount: "$420.00", status: "Pagado", date: "12 dic 2025" },
  { id: "P-4302", amount: "$310.00", status: "En revisión", date: "05 dic 2025" },
  { id: "P-4289", amount: "$265.00", status: "Pendiente", date: "28 nov 2025" },
];

const TOP_AFFILIATES = [
  { name: "Laura Méndez", revenue: "$980", conversions: 26, rate: "4.1%" },
  { name: "Equipo Ventas B2B", revenue: "$720", conversions: 18, rate: "3.4%" },
  { name: "Influencer MX", revenue: "$610", conversions: 15, rate: "2.9%" },
];

export default function AffiliatesDashboard({ affiliatePath, userId }) {
  const fullLink =
    typeof window !== "undefined" ? `${window.location.origin}${affiliatePath}` : affiliatePath;
  const canCopy = !!userId;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullLink);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Panel de afiliados</h1>
          <p className="text-sm text-muted-foreground">
            Resumen rápido de tu programa: rendimiento, pagos y actividad reciente.
          </p>
        </div>
        {/* <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={affiliatePath}>Ver enlace / activar</Link>
          </Button>
          <Button className="gap-2">
            Exportar
            <ArrowUpRight className="size-4" />
          </Button>
        </div> */}
      </div>

      <Card className="border-muted">
        <CardHeader>
          <CardTitle>Tu enlace de referido</CardTitle>
          <CardDescription>Comparte este enlace para atribuir tus referidos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row flex-wrap gap-2 w-full">
            <div className="flex-1 min-w-[260px]">
              <Input value={fullLink} readOnly className="font-mono text-sm" />
            </div>
            <div className="min-w-[140px] w-full sm:w-auto">
              <Button onClick={handleCopy} variant="outline" className="w-full hover:cursor-pointer" disabled={!canCopy}>
                <Copy className="size-4 mr-2" />
                Copiar enlace
              </Button>
            </div>
          </div>
          {!canCopy && (
            <p className="mt-2 text-xs text-muted-foreground">
              Activa tu enlace desde “Ver enlace / activar” para habilitar la copia.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.title} className="border-muted">
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex flex-col gap-1">
                <CardDescription>{stat.title}</CardDescription>
                <CardTitle className="text-2xl">{stat.value}</CardTitle>
              </div>
              <div className="rounded-md bg-muted p-2 text-muted-foreground">
                <stat.icon className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stat.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-muted">
          <CardHeader>
            <CardTitle>Progreso hacia el próximo pago</CardTitle>
            <CardDescription>
              Consolida tus ingresos y revisa cuánto falta para liberar el siguiente payout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/5 text-primary">
                  Objetivo $1,000
                </Badge>
                <span className="text-muted-foreground">Corte actual</span>
              </div>
              <span className="font-semibold">$680 / $1,000</span>
            </div>
            <Progress value={68} />
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Tiempo restante</p>
                <p className="text-base font-semibold flex items-center gap-1">
                  <Clock3 className="size-4 text-muted-foreground" />
                  12 días
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversión promedio</p>
                <p className="text-base font-semibold">3.6%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ticket por referido</p>
                <p className="text-base font-semibold">$38</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader>
            <CardTitle>Pagos recientes</CardTitle>
            <CardDescription>Estado de tus últimos tres pagos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {PAYOUTS.map((payout) => {
              const statusColor =
                payout.status === "Pagado"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : payout.status === "En revisión"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                  : "bg-muted text-muted-foreground";

              const StatusIcon =
                payout.status === "Pagado" ? CheckCircle2 : payout.status === "En revisión" ? Clock3 : PiggyBank;

              return (
                <div
                  key={payout.id}
                  className="flex items-center justify-between rounded-lg border border-muted/60 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">{payout.amount}</p>
                    <p className="text-xs text-muted-foreground">{payout.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon className="size-4 text-muted-foreground" />
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor}`}>
                      {payout.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-muted">
          <CardHeader>
            <CardTitle>Top afiliados</CardTitle>
            <CardDescription>Referidos que más convierten este mes.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Afiliado</TableHead>
                  <TableHead>Ingresos</TableHead>
                  <TableHead>Conversiones</TableHead>
                  <TableHead>Tasa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TOP_AFFILIATES.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.revenue}</TableCell>
                    <TableCell>{row.conversions}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.rate}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader>
            <CardTitle>Siguientes pasos</CardTitle>
            <CardDescription>Acciones rápidas para mejorar el programa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-2">
              <div className="mt-0.5">
                <CheckCircle2 className="size-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Comparte tu enlace con 3 socios</p>
                <p className="text-muted-foreground">Prioriza quienes ya generan tráfico.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="mt-0.5">
                <TrendingUp className="size-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Lanza una campaña de bienvenida</p>
                <p className="text-muted-foreground">Ofrece 10% extra en la primera compra.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="mt-0.5">
                <Wallet className="size-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Configura método de pago</p>
                <p className="text-muted-foreground">Asegura transferencias sin fricción.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
