"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Trash2Icon } from "lucide-react";

import { buildStrapiUrl } from "@/lib/strapi";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Eliminado: constantes usadas solo en el formulario de creación.

const randomId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const normalizeTrigger = (entry) => {
  if (!entry) return null;

  // Extraer los mensajes de la relación trigger_contents
  const triggerContents = entry.trigger_contents || [];
  const messages = triggerContents.map((tc) => ({
    id: tc.id || tc.documentId,
    message: tc.message || "",
  }));

  return {
    id: String(entry.documentId ?? entry.id ?? randomId()),
    documentId: entry.documentId ? String(entry.documentId) : null,
    name: entry.name ?? "",
    keywords: entry.keywords ?? "",
    keywords_ai: entry.keywords_ai ?? "",
    available: entry.available ?? false,
    id_ads: entry.id_ads ?? null,
    messages: messages, // 👈 Array de mensajes de la relación
  };
};

export default function TriggerManagement({
  initialTriggers = [],
  token,
  chatbotId,
  chatbotSlug,
}) {
  const [triggers, setTriggers] = useState(
    Array.isArray(initialTriggers)
      ? initialTriggers.map(normalizeTrigger).filter(Boolean)
      : []
  );
  // Eliminado: estado del formulario y errores, ya que la creación ocurre en la página /triggers/new.

  useEffect(() => {
    if (!Array.isArray(initialTriggers)) return;
    setTriggers(initialTriggers.map(normalizeTrigger).filter(Boolean));
  }, [initialTriggers]);

  // Eliminado: lógica de creación; ahora solo se lista.

  return (
    <div className="grid gap-6 pb-6">
      <Card className="bg-background/80 overflow-x-auto">
        <CardContent>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Nombre</TableHead>
                <TableHead className="min-w-[280px]">Palabras clave</TableHead>
                <TableHead className="min-w-[120px]">Visibilidad</TableHead>
                <TableHead className="min-w-[180px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {triggers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-20 text-center text-muted-foreground"
                  >
                    Aun no has configurado disparadores. Crea el primero para
                    automatizar tus flujos.
                  </TableCell>
                </TableRow>
              ) : (
                triggers.map((trigger) => (
                  <TableRow key={trigger.id}>
                    <TableCell>
                      <div
                        className="truncate max-w-[180px]"
                        title={trigger.name || "Sin nombre"}
                      >
                        {trigger.name || "Sin nombre"}
                      </div>
                      {trigger.id_ads && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ID: {trigger.id_ads}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {trigger.keywords ? (
                        <div
                          className="truncate max-w-[260px]"
                          title={trigger.keywords}
                        >
                          {trigger.keywords}
                        </div>
                      ) : (
                        <span className="text-xs">Sin palabras clave.</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={trigger.available ? "default" : "outline"}
                        className="uppercase"
                      >
                        {trigger.available ? "Activo" : "Pausado"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/dashboard/${encodeURIComponent(
                              chatbotSlug ?? chatbotId
                            )}/triggers/${encodeURIComponent(
                              trigger.documentId || trigger.id
                            )}/edit`}
                            className="whitespace-nowrap"
                          >
                            Editar
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          aria-label="Eliminar disparador"
                          title="Eliminar disparador"
                          disabled={!token || !chatbotId}
                          onClick={() => handleDelete(trigger)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {triggers.length > 0 && (
              <TableCaption className="text-xs">
                Los disparadores se sincronizan automaticamente con tu chatbot.
              </TableCaption>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
