import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import SelectUserAvatarMenu from "@/components/select-user-avatar-menu";
import Link from "next/link";
import { Check } from "lucide-react";
import CountdownOffer from "@/components/countdown-offer";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Planes",
  description: "Elige el plan que mejor se adapte a tu negocio.",
};

export default async function PlansPage() {
  const session = await auth()
  const email = session?.user?.email || ''
  const hotmartBase = 'https://pay.hotmart.com/U102463815A?off=99w022je'
  const hotmartHref = email ? `${hotmartBase}${hotmartBase.includes('?') ? '&' : '?'}email=${encodeURIComponent(email)}` : hotmartBase
  const hotmartPremiumBase = 'https://pay.hotmart.com/U102463815A?off=sybe6vzp'
  const hotmartPremiumHref = email ? `${hotmartPremiumBase}${hotmartPremiumBase.includes('?') ? '&' : '?'}email=${encodeURIComponent(email)}` : hotmartPremiumBase
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
          <h1 className="text-2xl font-semibold">🎉 Empieza tus 7 días gratis</h1>
          <p className="text-sm text-muted-foreground mt-2">Elige el plan que mejor se adapte a tu negocio.</p>
        </div>
        <CountdownOffer days={7} color="#ef4444" />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card style={{ animationDelay: "0ms", animationFillMode: "both" }} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-1000 ease-out hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader>
              <CardTitle>Básico</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">29$</span>
                <span className="ml-1">al mes</span>
              </CardDescription>
              <div className="mt-1 text-xs"><span className="text-muted-foreground">Antes: </span><span className="line-through opacity-70">58$/mes</span></div>
            </CardHeader>
            <CardContent className="pt-2 flex flex-col flex-1">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><span>Todas las funciones incluidas</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><span>1 número de WhatsApp</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><span>Sin miembros del equipo</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><span>Soporte por WhatsApp</span></li>
              </ul>
              <Button size="lg" className="w-full mt-auto h-12 text-base" asChild>
                 <a href={hotmartHref}>Empieza ahora</a>
               </Button>
            </CardContent>
          </Card>
          <Card style={{ animationDelay: "150ms", animationFillMode: "both" }} className="relative animate-in fade-in-0 slide-in-from-bottom-2 duration-1000 ease-out ring-2 ring-[#54a2b1] ring-opacity-70 dark:ring-[#54a2b1] shadow-xl bg-gradient-to-b from-[rgba(84,162,177,0.12)] dark:from-[rgba(84,162,177,0.12)] hover:shadow-2xl transition-shadow h-full flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#54a2b1] text-white text-xs font-semibold px-3 py-1 shadow">Mejor opción</div>
            <CardHeader>
              <CardTitle>Premium</CardTitle>
              <CardDescription>
                <span className="text-4xl font-extrabold text-foreground">49$</span>
                <span className="ml-1">al mes</span>
              </CardDescription>
              <div className="mt-1 text-xs"><span className="text-muted-foreground">Antes: </span><span className="line-through opacity-70">98$/mes</span></div>
            </CardHeader>
            <CardContent className="pt-2 flex flex-col flex-1">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-600" /><span>Todas las funciones incluidas</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-600" /><span>1 número de WhatsApp</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-600" /><span>Hasta 3 miembros del equipo</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-600" /><span>Flujos automatizados ilimitados</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-600" /><span>Reportes avanzados</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-600" /><span>Soporte por WhatsApp</span></li>
              </ul>
              <Button size="lg" className="w-full mt-auto h-12 text-base bg-[#54a2b1] hover:bg-[#4b93a1] text-white" asChild>
                 <a href={hotmartPremiumHref}>Empieza ahora</a>
               </Button>
            </CardContent>
          </Card>
          <Card style={{ animationDelay: "300ms", animationFillMode: "both" }} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-1000 ease-out hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader>
              <CardTitle>Personalizado</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">Precio a medida</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 flex flex-col flex-1">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><span>Todas las funciones incluidas</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><span>Multiples número de WhatsApp</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><span>Ilimitados miembros del equipo</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><span>Flujos automatizados ilimitados</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><span>Reportes avanzados y analytics</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><span>Soporte 24/7 dedicado</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><span>Integraciones personalizadas</span></li>
              </ul>
              <Button size="lg" className="w-full mt-auto h-12 text-base" asChild>
                <a href="https://www.instagram.com/elitecode.es/">Empieza ahora</a>
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>


  );
}