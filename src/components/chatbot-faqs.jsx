"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2Icon, PencilIcon, Trash2Icon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { buildStrapiUrl } from "@/lib/strapi"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"

export default function ChatbotFaqs({ items = [], token, chatbotId }) {
  const router = useRouter()
  const normalize = (f) => {
    const a = f?.attributes || f || {}
    return {
      id: f?.id ?? a?.id,
      documentId: a?.documentId,
      question: a?.question,
      response: a?.response,
      category: a?.category,
      createdAt: a?.createdAt,
      updatedAt: a?.updatedAt,
      publishedAt: a?.publishedAt,
    }
  }

  const [faqs, setFaqs] = useState(Array.isArray(items) ? items.map(normalize).filter(Boolean) : [])
  useEffect(() => {
    setFaqs(Array.isArray(items) ? items.map(normalize).filter(Boolean) : [])
  }, [items])

  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ question: "", response: "", category: "" })
  const [status, setStatus] = useState({ loading: false, type: null, message: null })
  const [toDelete, setToDelete] = useState(null)
  const [deleteStatus, setDeleteStatus] = useState({ loading: false, error: null })
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ question: "", response: "", category: "" })
  const [createStatus, setCreateStatus] = useState({ loading: false, type: null, message: null })

  const openEdit = (faq) => {
    setEditing(faq)
    setForm({
      question: faq?.question || "",
      response: faq?.response || "",
      category: faq?.category || "",
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
      const res = await fetch(buildStrapiUrl(`/api/faqs/${encodeURIComponent(docId)}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ data: { question: form.question, response: form.response, category: form.category } }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = body?.error?.message || "No se pudo actualizar la FAQ"
        setStatus({ loading: false, type: "error", message: msg })
        return
      }
      setFaqs((prev) => prev.map((f) => ((f.documentId || f.id) === docId) ? { ...f, question: form.question, response: form.response, category: form.category } : f))
-      setStatus({ loading: false, type: "success", message: "Actualizado" })
-      setTimeout(() => closeEdit(), 400)
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
      const res = await fetch(buildStrapiUrl(`/api/faqs/${encodeURIComponent(docId)}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDeleteStatus({ loading: false, error: body?.error?.message || "No se pudo eliminar la FAQ" })
        return
      }
      setFaqs((prev) => prev.filter((f) => ((f.documentId || f.id) !== docId)))
      setDeleteStatus({ loading: false, error: null })
      setToDelete(null)
      router.refresh()
    } catch (e) {
      setDeleteStatus({ loading: false, error: "Error de red al eliminar" })
    }
  }

  const openCreate = () => {
    setCreateOpen(true)
    setCreateForm({ question: "", response: "", category: "" })
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
      const payload = { data: { question: createForm.question, response: createForm.response, category: createForm.category, chatbot: chatbotId } }
      const res = await fetch(buildStrapiUrl(`/api/faqs`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCreateStatus({ loading: false, type: "error", message: body?.error?.message || "No se pudo crear la FAQ" })
        return
      }
      const raw = body?.data || body
      const normalized = normalize(raw) || { question: createForm.question, response: createForm.response, category: createForm.category }
      setFaqs((prev) => [normalized, ...prev])
-      setCreateStatus({ loading: false, type: "success", message: "Creada" })
-      setTimeout(() => closeCreate(), 400)
      toast.success("Creada")
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
          <CheckCircle2Icon className="size-4 text-muted-foreground" />
          Conocimiento
        </h4>
        <Button
          type="button"
          size="sm"
          className="w-full sm:w-auto"
          onClick={openCreate}
          disabled={!token || !chatbotId}
        >
          <PlusIcon className="size-4" /> Añadir pregunta
        </Button>
      </div>
      {faqs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin FAQs configuradas.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {faqs.map((f) => (
            <div key={f.documentId || f.id || f.question} className="rounded-xl border bg-background p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="font-medium leading-tight break-words">{f.question}</div>
                  {f.category && (
                    <span className="inline-flex text-xs rounded-md border px-2 py-0.5 text-muted-foreground w-fit">
                      {f.category}
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full sm:w-auto">
                  <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => openEdit(f)}>
                    <PencilIcon className="size-4" />
                    Editar
                  </Button>
                  <Button type="button" variant="destructive" size="sm" className="w-full sm:w-auto" onClick={() => setToDelete(f)}>
                    <Trash2Icon className="size-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
              {f.response && (
                <div className="mt-2 text-sm whitespace-pre-wrap break-words text-muted-foreground">
                  {f.response}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => (open ? null : closeEdit())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar FAQ</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-3">
              <label htmlFor="faq-question" className="text-sm font-medium">Pregunta</label>
              <Input id="faq-question" value={form.question} onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))} />
            </div>
            <div className="grid gap-3">
              <label htmlFor="faq-response" className="text-sm font-medium">Respuesta</label>
              <Textarea id="faq-response" rows={4} value={form.response} onChange={(e) => setForm((p) => ({ ...p, response: e.target.value }))} />
            </div>
            <div className="grid gap-3">
              <label htmlFor="faq-category" className="text-sm font-medium">Categoría</label>
              <Select value={form.category || undefined} onValueChange={(val) => setForm((p) => ({ ...p, category: val }))}>
                <SelectTrigger id="faq-category" className="w-full">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Horarios">Horarios</SelectItem>
                  <SelectItem value="Envíos">Envíos</SelectItem>
                  <SelectItem value="Pagos">Pagos</SelectItem>
                  <SelectItem value="Devoluciones">Devoluciones</SelectItem>
                  <SelectItem value="Otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEdit}>Cancelar</Button>
              <Button type="submit" disabled={status.loading || !token}>{status.loading ? "Guardando…" : "Guardar"}</Button>
            </DialogFooter>
            {status.type === "error" && (
               <p className="text-red-600 text-sm">{status.message}</p>
             )}
          </form>
        </DialogContent>
        <AlertDialog open={!!toDelete} onOpenChange={(open) => (open ? null : setToDelete(null))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar FAQ</AlertDialogTitle>
            </AlertDialogHeader>
            <p className="text-sm text-muted-foreground">¿Seguro que quieres eliminar esta pregunta? Esta acción no se puede deshacer.</p>
            {deleteStatus.error && <p className="text-sm text-red-600">{deleteStatus.error}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setToDelete(null)}>Cancelar</AlertDialogCancel>
              <Button onClick={handleDelete} disabled={deleteStatus.loading} variant="destructive">
                {deleteStatus.loading ? "Eliminando…" : "Eliminar"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={(open) => (open ? null : closeCreate())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva pregunta frecuente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-3">
              <label htmlFor="new-faq-question" className="text-sm font-medium">Pregunta</label>
              <Input id="new-faq-question" value={createForm.question} onChange={(e) => setCreateForm((p) => ({ ...p, question: e.target.value }))} />
            </div>
            <div className="grid gap-3">
              <label htmlFor="new-faq-response" className="text-sm font-medium">Respuesta</label>
              <Textarea id="new-faq-response" rows={4} value={createForm.response} onChange={(e) => setCreateForm((p) => ({ ...p, response: e.target.value }))} />
            </div>
            <div className="grid gap-3">
              <label htmlFor="new-faq-category" className="text-sm font-medium">Categoría</label>
              <Select value={createForm.category || undefined} onValueChange={(val) => setCreateForm((p) => ({ ...p, category: val }))}>
                <SelectTrigger id="new-faq-category" className="w-full">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Horarios">Horarios</SelectItem>
                  <SelectItem value="Envíos">Envíos</SelectItem>
                  <SelectItem value="Pagos">Pagos</SelectItem>
                  <SelectItem value="Devoluciones">Devoluciones</SelectItem>
                  <SelectItem value="Otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeCreate}>Cancelar</Button>
              <Button type="submit" disabled={createStatus.loading || !token || !chatbotId}>{createStatus.loading ? "Creando…" : "Crear"}</Button>
            </DialogFooter>
            {createStatus.type === "error" && (
               <p className="text-red-600 text-sm">{createStatus.message}</p>
             )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
