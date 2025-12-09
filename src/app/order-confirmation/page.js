import {
  CheckCircle,
  ArrowRight,
  Mail,
  CreditCard,
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

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          {/* <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div> */}
          <Image
            src="/images/wazend/bot-friends.png"
            alt="Descripción de la imagen"
            width={180}
            height={90}
            className="mx-auto"
            priority
          />
          <CardTitle className="text-2xl">¡Suscripción confirmada!</CardTitle>
          <CardDescription className="text-sm mt-2">
            Tu pago se ha procesado correctamente
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Próximos pasos */}
          <div className="space-y-3 text-xs">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              ¿Qué sigue?
            </h3>

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="mt-1">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Revisa tu correo</p>
                  <p className="text-xs text-muted-foreground">
                    Te hemos enviado un correo con los detalles de tu
                    suscripción
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Gestiona tu suscripción</p>
                  <p className="text-xs text-muted-foreground">
                    Puedes ver y administrar tu plan desde tu perfil
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1">
                  <Sparkles className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Empieza a disfrutar</p>
                  <p className="text-xs text-muted-foreground">
                    Todas las funciones premium están disponibles ahora
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <Link href="/select" className="block">
              <Button className="w-full text-sm">
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            {/* <Link href="/billing" className="block">
              <Button variant="outline" className="w-full text-sm">
                Ver facturación
              </Button>
            </Link> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
