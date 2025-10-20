import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import SelectUserAvatarMenu from "@/components/select-user-avatar-menu";
import Link from "next/link";

export const metadata = {
  title: "Planes",
  description: "Elige el plan que mejor se adapte a tu negocio.",
};

export default function PlansPage() {
  return (

    <div className="min-h-screen w-full">
      <div className="mx-auto max-w-6xl px-4 lg:px-6 py-8">

        <div className="flex items-center justify-between">
          <div>
            <Link href="/select" className="block" aria-label="Inicio">
              <span className="inline-flex items-center">
                <Image
                  src="/images/logo-black.png"
                  alt="Logo"
                  width={140}
                  height={24}
                  priority
                  className="h-8 w-auto dark:hidden"
                />
                <Image
                  src="/images/logo-white.png"
                  alt="Logo"
                  width={140}
                  height={24}
                  priority
                  className="hidden h-8 w-auto dark:block"
                />
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <SelectUserAvatarMenu />
          </div>
        </div>

        <div className="mt-10">
          <h1 className="text-2xl font-semibold">Planes</h1>
          <p className="text-sm text-muted-foreground mt-2">Elige el plan que mejor se adapte a tu negocio.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card style={{ animationDelay: "0ms", animationFillMode: "both" }} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-1000 ease-out">
            <CardHeader>
              <CardTitle>Básico</CardTitle>
              <CardDescription>Empieza gratis con lo esencial.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-sm text-muted-foreground mb-3">
                Ideal para probar la plataforma.
              </p>
              <Button size="sm" className="w-full">Seleccionar</Button>
            </CardContent>
          </Card>
          <Card style={{ animationDelay: "150ms", animationFillMode: "both" }} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-1000 ease-out">
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>Funciones avanzadas para crecer.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-sm text-muted-foreground mb-3">
                Automatización y métricas avanzadas.
              </p>
              <Button size="sm" className="w-full">Seleccionar</Button>
            </CardContent>
          </Card>
          <Card style={{ animationDelay: "300ms", animationFillMode: "both" }} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-1000 ease-out">
            <CardHeader>
              <CardTitle>Business</CardTitle>
              <CardDescription>Escala con soporte y seguridad.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-sm text-muted-foreground mb-3">
                Integraciones y soporte dedicado.
              </p>
              <Button size="sm" className="w-full">Seleccionar</Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>


  );
}