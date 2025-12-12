"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Trash2Icon, MoreHorizontal } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

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
    contexto: entry.contexto ?? "",
    keywords: entry.keywords ?? "",
    keywords_ai: entry.keywords_ai ?? "",
    available: entry.available ?? false,
    messages: messages,
  };
};

export default function TriggerManagement({
  initialTriggers = [],
  token,
  chatbotId,
  chatbotSlug,
}) {
  const router = useRouter();
  const [triggers, setTriggers] = useState(
    Array.isArray(initialTriggers)
      ? initialTriggers.map(normalizeTrigger).filter(Boolean)
      : []
  );

  useEffect(() => {
    if (!Array.isArray(initialTriggers)) return;
    setTriggers(initialTriggers.map(normalizeTrigger).filter(Boolean));
  }, [initialTriggers]);

  // Escuchar evento de actualización de disparadores
  useEffect(() => {
    const handleTriggersUpdated = () => {
      if (typeof router.refresh === "function") {
        router.refresh();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("triggers:updated", handleTriggersUpdated);
      return () =>
        window.removeEventListener("triggers:updated", handleTriggersUpdated);
    }
  }, [router]);

  const handleDelete = async (trigger) => {
    if (!token) {
      toast.error("Sesion no valida para eliminar.");
      return;
    }

    const deleteId = trigger.documentId || trigger.id;
    const prev = [...triggers];
    setTriggers((list) => list.filter((t) => t.id !== trigger.id));

    // Intento de borrado en cascada: primero contenidos asociados, luego el disparador.
    const deleteRelatedContents = async () => {
      try {
        const qs = new URLSearchParams();
        qs.set("populate[trigger_contents][fields][0]", "documentId");
        qs.set("populate[trigger_contents][fields][1]", "id");
        qs.set(
          "populate[trigger_contents][populate][messageMedia][fields][0]",
          "id"
        );

        const detailsUrl = buildStrapiUrl(
          `/api/triggers/${deleteId}?${qs.toString()}`
        );
        const detailRes = await fetch(detailsUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!detailRes.ok) return;
        const payload = await detailRes.json().catch(() => ({}));
        const raw = payload?.data || payload;
        const contents =
          raw?.attributes?.trigger_contents?.data ||
          raw?.trigger_contents ||
          [];

        const contentIds = contents
          .map((c) => c?.id || c?.documentId || c?.document_id)
          .filter(Boolean);

        if (!contentIds.length) return;

        await Promise.allSettled(
          contentIds.map((cid) =>
            fetch(buildStrapiUrl(`/api/trigger-contents/${cid}`), {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            })
          )
        );
      } catch (error) {
        console.error("Error eliminando contenidos relacionados:", error);
      }
    };

    await deleteRelatedContents();

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
    <div className="grid gap-8 pb-6">
      <div className="overflow-x-auto rounded-xl border">
        <Table className="min-w-max">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="min-w-[200px] ml-1">Nombre</TableHead>
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
                  className="h-20 text-center text-muted-foreground mb"
                >
                  Aun no has configurado disparadores. Crea el primero para
                  automatizar tus flujos.
                </TableCell>
              </TableRow>
            ) : (
              triggers.map((trigger) => (
                <TableRow key={trigger.id} className="even:bg-muted/10">
                  <TableCell>
                    <div
                      className={`truncate max-w-[180px] ${trigger.name ? "hover:cursor-pointer hover:underline" : ""}`}
                      title={trigger.name || "Sin nombre"}
                      onClick={
                        trigger.name
                          ? () => {
                              const href = `/dashboard/${encodeURIComponent(
                                chatbotSlug ?? chatbotId
                              )}/triggers/${encodeURIComponent(
                                trigger.documentId || trigger.id
                              )}/edit`;
                              router.push(href);
                            }
                          : null
                      }
                    >
                      {trigger.name || "Sin nombre"}
                    </div>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            const href = `/dashboard/${encodeURIComponent(
                              chatbotSlug ?? chatbotId
                            )}/triggers/${encodeURIComponent(
                              trigger.documentId || trigger.id
                            )}/edit`;
                            router.push(href);
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={(event) => {
                                event.preventDefault();
                              }}
                            >
                              Eliminar
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Eliminar este disparador?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. El disparador
                                se eliminará permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(trigger)}
                                disabled={!token || !chatbotId}
                              >
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {/* {triggers.length > 0 && (
            <TableCaption className="text-xs">
              Los disparadores se sincronizan automaticamente con tu chatbot.
            </TableCaption>
          )} */}
        </Table>
      </div>
    </div>
  );
}
