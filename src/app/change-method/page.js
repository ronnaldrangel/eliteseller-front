import {
  CheckCircle,
  ArrowRight,
  Mail,
  CreditCard,
  Shield,
  Sparkles,
} from "lucide-react";
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

export default function CardUpdateSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <Image
            src="/images/robot/card.webp"
            alt="Cambio de tarjeta exitoso"
            width={180}
            height={90}
            className="mx-auto"
            priority
          />
          <CardTitle className="text-2xl mb-4">
            ¡Tarjeta actualizada correctamente!
          </CardTitle>
          {/* <CardDescription className="text-sm mt-2 mb-6">
            Tu método de pago se ha actualizado exitosamente
          </CardDescription> */}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Información importante */}
          <div className="space-y-3 text-xs">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Información importante
            </h3>

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="mt-1">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Nueva tarjeta registrada</p>
                  <p className="text-xs text-muted-foreground">
                    Tu nueva tarjeta se usará para los próximos cobros
                    automáticos
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Datos seguros</p>
                  <p className="text-xs text-muted-foreground">
                    Toda tu información está protegida con encriptación de nivel
                    bancario
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Confirmación enviada</p>
                  <p className="text-xs text-muted-foreground">
                    Hemos enviado un correo con los detalles del cambio
                    realizado
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <Link href="/plans" className="block">
              <Button className="w-full text-sm">
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            {/* <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full text-sm">
                Volver al dashboard
              </Button>
            </Link> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
