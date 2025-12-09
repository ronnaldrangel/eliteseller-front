"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2Icon, PencilIcon, Trash2Icon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { buildStrapiUrl } from "@/lib/strapi"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function ChatbotPayments({ items = [], token, chatbotId }) {
  const router = useRouter()
  const normalize = (p) => {
    const a = p?.attributes || p || {}
    return {
      id: p?.id ?? a?.id,
      documentId: a?.documentId,
      name: a?.name,
      holder: a?.holder || a?.titular || "",
      type: a?.type,
      instructions: a?.instructions,
      createdAt: a?.createdAt,
      updatedAt: a?.updatedAt,
      publishedAt: a?.publishedAt,
    }
  }

  const [payments, setPayments] = useState(Array.isArray(items) ? items.map(normalize).filter(Boolean) : [])
  useEffect(() => {
    setPayments(Array.isArray(items) ? items.map(normalize).filter(Boolean) : [])
  }, [items])

  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: "", holder: "", type: "", instructions: "" })
  const [status, setStatus] = useState({ loading: false, type: null, message: null })
  const [toDelete, setToDelete] = useState(null)
  const [deleteStatus, setDeleteStatus] = useState({ loading: false, error: null })
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: "", holder: "", type: "", instructions: "" })
  const [createStatus, setCreateStatus] = useState({ loading: false, type: null, message: null })

  const openEdit = (pay) => {
    setEditing(pay)
    setForm({
      name: pay?.name || "",
      holder: pay?.holder || "",
      type: pay?.type || "",
      instructions: pay?.instructions || "",
    })
  }
  const closeEdit = () => {
    setEditing(null)
    setStatus({ loading: false, type: null, message: null })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!editing) return
    setStatus({ loading: true, type: null, message: null })
    try {
      const docId = editing.documentId || editing.id
      const res = await fetch(buildStrapiUrl(`/api/payments/${encodeURIComponent(docId)}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          data: {
            name: form.name,
            holder: form.holder,
            type: form.type,
            instructions: form.instructions,
          },
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = body?.error?.message || "No se pudo actualizar el metodo de pago"
        setStatus({ loading: false, type: "error", message: msg })
        return
      }
      setPayments((prev) =>
        prev.map((p) =>
          (p.documentId || p.id) === docId
            ? { ...p, name: form.name, holder: form.holder, type: form.type, instructions: form.instructions }
            : p
        )
      )
      toast.success("Actualizado")
      setStatus({ loading: false, type: null, message: null })
      closeEdit()
      router.refresh()
    } catch (err) {
      setStatus({ loading: false, type: "error", message: "Error de red al actualizar" })
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleteStatus({ loading: true, error: null })
    try {
      const docId = toDelete.documentId || toDelete.id
      const res = await fetch(buildStrapiUrl(`/api/payments/${encodeURIComponent(docId)}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDeleteStatus({ loading: false, error: body?.error?.message || "No se pudo eliminar el metodo de pago" })
        return
      }
      setPayments((prev) => prev.filter((p) => (p.documentId || p.id) !== docId))
      setDeleteStatus({ loading: false, error: null })
      setToDelete(null)
      router.refresh()
    } catch (e) {
      setDeleteStatus({ loading: false, error: "Error de red al eliminar" })
    }
  }

  const openCreate = () => {
    setCreateOpen(true)
    setCreateForm({ name: "", holder: "", type: "", instructions: "" })
    setCreateStatus({ loading: false, type: null, message: null })
  }
  const closeCreate = () => {
    setCreateOpen(false)
    setCreateStatus({ loading: false, type: null, message: null })
  }
  const handleCreate = async (e) => {
    e.preventDefault()
    setCreateStatus({ loading: true, type: null, message: null })
    try {
      const payload = {
        data: {
          name: createForm.name,
          holder: createForm.holder,
          type: createForm.type,
          instructions: createForm.instructions,
          chatbot: chatbotId,
        },
      }
      const res = await fetch(buildStrapiUrl(`/api/payments`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCreateStatus({
          loading: false,
          type: "error",
          message: body?.error?.message || "No se pudo crear el metodo de pago",
        })
        return
      }
      const raw = body?.data || body
      const normalized =
        normalize(raw) || {
          name: createForm.name,
          holder: createForm.holder,
          type: createForm.type,
          instructions: createForm.instructions,
        }
      setPayments((prev) => [normalized, ...prev])
      toast.success("Creado")
      setCreateStatus({ loading: false, type: null, message: null })
      closeCreate()
      router.refresh()
    } catch (err) {
      setCreateStatus({ loading: false, type: "error", message: "Error de red al crear" })
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle2Icon className="size-4 text-muted-foreground" /> Metodos de pago
        </h4>
        <Button type="button" size="sm" className="w-full sm:w-auto" onClick={openCreate} disabled={!token || !chatbotId}>
          <PlusIcon className="size-4" /> Anadir metodo
        </Button>
      </div>
      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin medios de pago configurados.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {payments.map((p) => (
            <div key={p.documentId || p.id || p.name} className="rounded-xl border bg-background p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="font-medium leading-tight break-words">{p.name}</div>
                  {p.holder && (
                    <div className="text-xs text-muted-foreground break-words">Titular: {p.holder}</div>
                  )}
                  {p.type && (
                    <span className="inline-flex text-xs rounded-md border px-2 py-0.5 text-muted-foreground w-fit">
                      {p.type}
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full sm:w-auto">
                  <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => openEdit(p)}>
                    <PencilIcon className="size-4" />
                    Editar
                  </Button>
                  <Button type="button" variant="destructive" size="sm" className="w-full sm:w-auto" onClick={() => setToDelete(p)}>
                    <Trash2Icon className="size-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
              {p.instructions && (
                <pre className="mt-2 text-sm whitespace-pre-wrap break-words text-muted-foreground">{p.instructions}</pre>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => (open ? null : closeEdit())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar metodo de pago</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-3">
              <label htmlFor="pay-name" className="text-sm font-medium">
                Nombre
              </label>
              <Input id="pay-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid gap-3">
              <label htmlFor="pay-holder" className="text-sm font-medium">
                Titular
              </label>
              <Input
                id="pay-holder"
                value={form.holder}
                onChange={(e) => setForm((p) => ({ ...p, holder: e.target.value }))}
              />
            </div>
            <div className="grid gap-3">
              <label htmlFor="pay-type" className="text-sm font-medium">
                Tipo
              </label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger id="pay-type" className="w-full">
                  <SelectValue placeholder="Seleccione un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Billeteras virtuales">Billeteras virtuales</SelectItem>
                  <SelectItem value="Transferencia bancaria">Transferencia bancaria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <label htmlFor="pay-instructions" className="text-sm font-medium">
                Instrucciones
              </label>
              <Textarea
                id="pay-instructions"
                rows={4}
                value={form.instructions}
                onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEdit}>
                Cancelar
              </Button>
              <Button type="submit" disabled={status.loading || !token}>
                {status.loading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
            {status.type && (
              <p className={status.type === "success" ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
                {status.message}
              </p>
            )}
          </form>
        </DialogContent>
        <AlertDialog open={!!toDelete} onOpenChange={(open) => (open ? null : setToDelete(null))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar metodo de pago</AlertDialogTitle>
            </AlertDialogHeader>
            <p className="text-sm text-muted-foreground">
              Seguro que quieres eliminar este metodo? Esta accion no se puede deshacer.
            </p>
            {deleteStatus.error && <p className="text-sm text-red-600">{deleteStatus.error}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteStatus.loading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteStatus.loading ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={(open) => (open ? null : closeCreate())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo metodo de pago</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-3">
              <label htmlFor="new-pay-name" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="new-pay-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-3">
              <label htmlFor="new-pay-holder" className="text-sm font-medium">
                Titular
              </label>
              <Input
                id="new-pay-holder"
                value={createForm.holder}
                onChange={(e) => setCreateForm((p) => ({ ...p, holder: e.target.value }))}
              />
            </div>
            <div className="grid gap-3">
              <label htmlFor="new-pay-type" className="text-sm font-medium">
                Tipo
              </label>
              <Select value={createForm.type} onValueChange={(v) => setCreateForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger id="new-pay-type" className="w-full">
                  <SelectValue placeholder="Seleccione un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Billeteras virtuales">Billeteras virtuales</SelectItem>
                  <SelectItem value="Transferencia bancaria">Transferencia bancaria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <label htmlFor="new-pay-instructions" className="text-sm font-medium">
                Instrucciones
              </label>
              <Textarea
                id="new-pay-instructions"
                rows={4}
                value={createForm.instructions}
                onChange={(e) => setCreateForm((p) => ({ ...p, instructions: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeCreate}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createStatus.loading || !token || !chatbotId}>
                {createStatus.loading ? "Creando..." : "Crear"}
              </Button>
            </DialogFooter>
            {createStatus.type === "error" && <p className="text-red-600 text-sm">{createStatus.message}</p>}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
