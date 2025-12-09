"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";


// Personalizar las imágenes por paso
const STEP_IMAGES = [
  "/images/affiliates/step1.webp",
  "/images/affiliates/step2.webp",
  "/images/affiliates/step3.webp",
];

const STEPS = [
  {
    title: "Invita a tu audiencia",
    desc: "Comparte tu enlace de referencia único y deja que tus amigos o audiencia se unan al mundo y confiabilidad de EliteSeller.",
  },
  {
    title: "Tus amigos/audiencia aceptan",
    desc: "Ellos se registran, comienzan a usar EliteSeller y experimentan nuestra magia.",
  },
  {
    title: "Recibe tu pago",
    desc: "Cuando realizan un pago verificado, ganas 20% fácil y rápido.",
  },
];

export default function AffiliatePage() {
  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6 py-4 md:py-6 gap-6">
      <Card className="border-primary/10">
        <CardHeader className="gap-2">
          <CardTitle className="text-xl md:text-2xl">
            Tu enlace de afiliado
          </CardTitle>
          <CardDescription className="max-w-3xl">
            Necesitas activar el afiliado para obtener tu enlace de referencia
            único, que te permite invitar a nuevos usuarios y ganar recompensas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <a href="https://calendly.com/elitecode2025dev/30min" target="_blank" rel="noopener noreferrer" aria-label="Activar Afiliado">
              Activar Afiliado
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-muted">
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 items-start">
            {STEPS.map((step, idx) => (
              <div
                key={step.title}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="w-40 h-40 md:w-44 md:h-44">
                  <Image
                    src={STEP_IMAGES[idx]}
                    alt={`Paso ${idx + 1}`}
                    width={100}
                    height={100}
                    className="h-full w-full object-contain"
                    priority={true}
                  />
                </div>

                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background text-sm font-semibold text-muted-foreground">
                  {idx + 1}
                </div>

                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground max-w-[28rem]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
