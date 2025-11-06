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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    messages: messages,
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

  useEffect(() => {
    if (!Array.isArray(initialTriggers)) return;
    setTriggers(initialTriggers.map(normalizeTrigger).filter(Boolean));
  }, [initialTriggers]);

  const handleDelete = async (trigger) => {
    if (!token) {
      toast.error("Sesion no valida para eliminar.");
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar el disparador "${trigger.name || "Sin nombre"}"?`
    );
    if (!confirmed) return;

    const deleteId = trigger.documentId || trigger.id;
    const prev = [...triggers];
    setTriggers((list) => list.filter((t) => t.id !== trigger.id));

    try {
      const res = await fetch(buildStrapiUrl(`/api/triggers/${deleteId}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const details = await res.json().catch(() => ({}));
        const message =
          details?.error?.message || "No se pudo eliminar el disparador.";
        setTriggers(prev);
        toast.error(message);
      } else {
        toast.success("Disparador eliminado.");
      }
    } catch (error) {
      console.error("Error eliminando trigger:", error);
      setTriggers(prev);
      toast.error("Error de red al eliminar el disparador.");
    }
  };

  return (
    <div className="grid gap-6 pb-6">
      <Card className="bg-background/80 overflow-x-auto">
        <CardContent>
          <Table className="min-w-max">
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

