import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { Zap, Sparkles, ArrowRight } from "lucide-react";

export default function BatteryChargePage({ searchParams }) {
  const name = String(searchParams?.name || "").trim();
  const price = String(searchParams?.price || "").trim();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <Image
            src="/images/robot/battery-charge.png"
            alt=""
            width={180}
            height={90}
            className="mx-auto"
            priority
          />
          <CardTitle className="text-2xl">¡Recarga exitosa!</CardTitle>
          <CardDescription className="text-sm mt-2">
            Ramoncito está listo para despegar.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Información del paquete */}
          <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/20 rounded-full p-2">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Detalles de tu recarga</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Paquete
                  </span>
                </div>
                <span className="text-base font-bold text-foreground">
                  {name || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Total pagado
                  </span>
                </div>
                <span className="text-base font-bold text-foreground">
                  ${price || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Mensaje motivacional */}
          <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">
                  ¡Ramoncito está listo para despegar!
                </span>{" "}
                Ahora puedes continuar disfrutando de todas las funcionalidades
                sin límites.
              </p>
            </div>
          </div>

          {/* Botón de continuar */}
          <Link href="/select" className="block">
            <Button
              size="lg"
              className="w-full text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              Continuar al Dashboard
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
