"use client";

import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Users, Bug } from "lucide-react";

export default function TutorialsPage() {
    const tutorials = [
        {
            id: 1,
            title: "Introducción al Dashboard",
            description: "Aprende a navegar por las funciones principales y saca el máximo partido a tu panel de control.",
            duration: "5 min",
            category: "Básico",
            icon: PlayCircle,
        },
        {
            id: 2,
            title: "Gestión de Usuarios",
            description: "Todo lo que necesitas saber sobre cómo administrar, editar y gestionar los usuarios de tu plataforma.",
            duration: "8 min",
            category: "Gestión",
            icon: Users,
        },
        {
            id: 3,
            title: "Configuración de Chatbots",
            description: "Guía paso a paso para crear, entrenar y desplegar tus propios asistentes virtuales.",
            duration: "12 min",
            category: "Avanzado",
            icon: PlayCircle,
        },
        {
            id: 4,
            title: "Solución de Problemas Comunes",
            description: "¿Tienes algún problema? Mira este video para resolver los errores más frecuentes rápidamente.",
            duration: "6 min",
            category: "Soporte",
            icon: Bug,
        },
    ];

    return (
        <div className="p-8 space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Tutoriales</h2>
                <p className="text-muted-foreground">
                    Aprende a utilizar todas las herramientas con nuestros videos explicativos.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tutorials.map((tutorial) => (
                    <Card key={tutorial.id} className="hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                    <tutorial.icon className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                    {tutorial.category}
                                </span>
                            </div>
                            <CardTitle className="mt-4 text-xl">{tutorial.title}</CardTitle>
                            <CardDescription className="line-clamp-2 h-10">
                                {tutorial.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                                <span className="flex items-center gap-1">
                                    <PlayCircle className="h-4 w-4" /> {tutorial.duration}
                                </span>
                            </div>
                            <Button className="w-full" variant="outline">
                                Ver Video
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
