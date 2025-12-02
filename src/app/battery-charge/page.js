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

export default async function BatteryChargePage({ searchParams }) {
  const sp = await searchParams;
  const name = String(sp?.name || "").trim();
  const price = String(sp?.price || "").trim();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <Image
            src="/images/robot/battery-charge-2.webp"
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

        <CardContent className="space-y-6 flex flex-col items-center">
          {/* Información del paquete */}
          <div className="w-full max-w-md rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 space-y-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div>
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Detalles de tu recarga</h3>
            </div>


            <div className="space-y-3">
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-background/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    Paquete:
                  </span>
                </div>
                <span className="text-base font-bold text-foreground">
                  {name || "—"}
                </span>
              </div>


              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-background/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total pagado:
                  </span>
                </div>
                <span className="text-base font-bold text-foreground">
                  ${price || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Botón de continuar */}
          <Link href="/select" className="block w-full max-w-md">
            <Button
              size="lg"
              className="w-full text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              Continuar
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
