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

  const plans = [
    {
      title: 'Básico',
      price: '29$',
      priceClass: 'text-3xl font-bold',
      perText: 'al mes',
      beforePrice: '58$/mes',
      features: [
        'Todas las funciones incluidas',
        '1 número de WhatsApp',
        'Sin miembros del equipo',
        'Soporte por WhatsApp',
      ],
      href: hotmartHref,
      delay: '0ms',
      highlight: false,
      featureIconColor: 'text-green-600',
    },
    {
      title: 'Premium',
      price: '49$',
      priceClass: 'text-4xl font-extrabold',
      perText: 'al mes',
      beforePrice: '98$/mes',
      features: [
        'Todas las funciones incluidas',
        '1 número de WhatsApp',
        'Hasta 3 miembros del equipo',
        'Flujos automatizados ilimitados',
        'Reportes avanzados',
        'Soporte por WhatsApp',
      ],
      href: hotmartPremiumHref,
      delay: '150ms',
      highlight: true,
      badgeText: 'Mejor opción',
      featureIconColor: 'text-cyan-600',
    },
    {
      title: 'Empresarial',
      price: 'Precio a medida',
      priceClass: 'text-3xl font-bold',
      perText: '',
      beforePrice: '',
      features: [
        'Todas las funciones incluidas',
        'Multiples número de WhatsApp',
        'Ilimitados miembros del equipo',
        'Flujos automatizados ilimitados',
        'Reportes avanzados y analytics',
        'Soporte 24/7 dedicado',
        'Integraciones personalizadas',
      ],
      href: 'https://www.instagram.com/elitecode.es/',
      delay: '300ms',
      highlight: false,
      featureIconColor: 'text-green-600',
    },
  ]

  const PlanCard = ({ title, price, priceClass, perText, beforePrice, features, href, delay, highlight, badgeText, featureIconColor }) => {
    const highlightClasses = highlight
      ? 'relative ring-opacity-70 shadow-xl bg-gradient-to-b from-[rgba(84,162,177,0.12)] dark:from-[rgba(84,162,177,0.12)] hover:shadow-2xl'
      : 'hover:shadow-lg'

    return (
      <Card style={{ animationDelay: delay, animationFillMode: 'both' }} className={`animate-in fade-in-0 slide-in-from-bottom-2 duration-1000 ease-out transition-shadow h-full flex flex-col ${highlightClasses}`}>
        {highlight && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 shadow">
            {badgeText || 'Mejor opción'}
          </div>
        )}
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            <span className={`${priceClass} text-foreground`}>{price}</span>
            {perText && <span className="ml-1">{perText}</span>}
          </CardDescription>
          {beforePrice && (
            <div className="mt-1 text-xs"><span className="text-muted-foreground">Antes: </span><span className="line-through opacity-70">{beforePrice}</span></div>
          )}
        </CardHeader>
        <CardContent className="pt-2 flex flex-col flex-1">
          <ul className="space-y-2 text-sm text-muted-foreground mb-6">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className={`h-4 w-4 ${featureIconColor}`} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button size="lg" className="w-full mt-auto h-12 text-base" asChild>
            <a href={href}>Empieza ahora</a>
          </Button>
        </CardContent>
      </Card>
    )
  }
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
          {plans.map((p) => (
            <PlanCard key={p.title} {...p} />
          ))}
        </div>

      </div>
    </div>


  );
}