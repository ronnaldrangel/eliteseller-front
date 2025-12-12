"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { buildStrapiUrl } from "@/lib/strapi"
import { Upload, FileIcon, FileSpreadsheetIcon, FileTextIcon, Trash2, XIcon } from "lucide-react"
import { toast } from "sonner"


function DropzoneButton({ id, multiple = true, onChange }) {
  return (
    <label
      htmlFor={id}
      className="relative block rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
    >
      <div className="flex h-32 w-full flex-col items-center justify-center gap-2">
        <div className="rounded-full bg-muted/50 p-2">
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm">
          <span className="font-medium">Suelta archivos aquí</span>{" "}
          <span className="text-muted-foreground">o</span>{" "}
          <span className="text-primary underline">examinar archivos</span>
        </p>
        <p className="text-xs text-muted-foreground">Acepta PDF, Excel y archivos de texto</p>
      </div>

      <input
        id={id}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        onChange={onChange}
      />
    </label>
  )
}

function formatDate(date) {
  try {
    return new Date(date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return "--"
  }
}

function formatBytes(bytes) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return ""
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1)
  const value = n / Math.pow(1024, i)
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[i]}`
}

export default function RagPageClient({ chatbotSlug, chatbotId, chatbotDocumentId, token, existingFiles = [], loadError, initialActiveRag = false }) {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [files, setFiles] = useState(Array.isArray(existingFiles) ? existingFiles : [])
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [activeRag, setActiveRag] = useState(!!initialActiveRag)
  const [toggleLoading, setToggleLoading] = useState(false)

  const resourceIdParam = chatbotSlug  // ?? chatbotDocumentId ?? chatbotId ?? 
  const canUpdate = useMemo(() => !!token && !!resourceIdParam, [token, resourceIdParam])

  const toggleActiveRag = async (nextValue = !activeRag) => {
    if (!canUpdate) {
      toast.error("Faltan datos del chatbot para actualizar")
      return
    }
    setToggleLoading(true)
    const fieldKeys = ["active_rag", "activeRag"]
    try {
      for (let i = 0; i < fieldKeys.length; i++) {
        const field = fieldKeys[i]
        const res = await fetch(buildStrapiUrl(`/api/chatbots/${resourceIdParam}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ data: { [field]: nextValue } }),
        })
        const body = await res.json().catch(() => ({}))
        if (res.ok) {
          setActiveRag(nextValue)
          toast.success(nextValue ? "RAG activado para el chatbot." : "RAG desactivado para el chatbot.")
          return
        }
        const isInvalidKey = res.status === 400 && (body?.error?.details?.key === field || body?.error?.name === "ValidationError")
        if (isInvalidKey && i < fieldKeys.length - 1) continue
        toast.error(body?.error?.message || "No se pudo actualizar el estado de RAG")
        return
      }
    } catch (err) {
      toast.error("Error de red al actualizar")
    } finally {
      setToggleLoading(false)
    }
  }

  const onDropChange = (fileList) => {
    const fs = Array.from(fileList || [])
    setSelectedFiles((prev) => {
      const merged = [...prev]
      fs.forEach((f) => {
        const exists = merged.some(
          (m) => m.name === f.name && m.size === f.size && m.type === f.type
        )
        if (!exists) merged.push(f)
      })
      return merged
    })
  }

  const removeSelected = (target) => {
    setSelectedFiles((prev) =>
      prev.filter(
        (f) =>
          !(
            String(f.name) === String(target.name) &&
            Number(f.size) === Number(target.size) &&
            String(f.type) === String(target.type)
          )
      )
    )
  }

  const handleUpdate = async () => {
    if (!canUpdate) {
      toast.error("Faltan datos de autenticación")
      return
    }
    if (!selectedFiles.length) {
      toast.error("Selecciona al menos un archivo")
      return
    }
    setSaving(true)
    try {
      // Subir nuevos archivos
      const fd = new FormData()
      selectedFiles.forEach((f) => fd.append("files", f))
      const uploadRes = await fetch(buildStrapiUrl("/api/upload"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const uploaded = await uploadRes.json().catch(() => [])
      if (!uploadRes.ok) {
        const msg = Array.isArray(uploaded) ? "No se pudieron subir los archivos" : uploaded?.error?.message || "Error al subir archivos"
        toast.error(msg)
        setSaving(false)
        return
      }
      const newItems = Array.isArray(uploaded)
        ? uploaded.map((m) => ({ id: m.id, name: m.name, url: m.url, mime: m.mime, createdAt: m.createdAt }))
        : []
      const newIds = newItems.map((m) => Number(m.id)).filter((n) => Number.isFinite(n))

      // Construir lista final de IDs (existentes + nuevos)
      const existingIds = files.map((f) => Number(f.id)).filter((n) => Number.isFinite(n))
      const finalIds = Array.from(new Set([...existingIds, ...newIds]))

      // Actualizar campo rag del chatbot (usar set para relaciones)
      const putRes = await fetch(buildStrapiUrl(`/api/chatbots/${encodeURIComponent(resourceIdParam)}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: { rag: { set: finalIds } } }),
      })
      const putBody = await putRes.json().catch(() => ({}))
      if (!putRes.ok) {
        toast.error(`Error al actualizar el chatbot: ${putBody?.error?.message}` || "No se pudo actualizar el chatbot")
        setSaving(false)
        return
      }

      setFiles((prev) => [...prev, ...newItems])
      setSelectedFiles([])
      toast.success("Archivos actualizados")
    } catch (e) {
      toast.error("Error de red al actualizar")
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id) => {
    if (!id || !canUpdate) return
    setSaving(true)
    try {
      const remainingIds = files.filter((f) => String(f.id) !== String(id)).map((f) => Number(f.id)).filter((n) => Number.isFinite(n))
      const res = await fetch(buildStrapiUrl(`/api/chatbots/${encodeURIComponent(resourceIdParam)}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: { rag: { set: remainingIds } } }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body?.error?.message || "No se pudo eliminar el archivo")
        setSaving(false)
        return
      }
      setFiles((prev) => prev.filter((f) => String(f.id) !== String(id)))
      toast.success("Archivo eliminado")
    } catch (e) {
      toast.error("Error de red al eliminar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Sistema R.A.G</h1>
            <p className="text-sm text-muted-foreground">Sube y gestiona archivos para el conocimiento avanzado de tu chatbot.</p>
          </div>
        </div>

        {loadError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{loadError}</div>
        ) : null}

        <div className="grid grid-cols-1 gap-4">
          <Card className="rounded-xl border bg-card">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base">Activar RAG</CardTitle>
                <CardDescription>Habilita o desactiva el uso de los archivos RAG para este chatbot.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={activeRag ? "default" : "secondary"}>
                  {activeRag ? "Activado" : "Desactivado"}
                </Badge>
                <Switch
                  id="rag-toggle-switch"
                  checked={activeRag}
                  disabled={!canUpdate || toggleLoading}
                  onCheckedChange={(checked) => toggleActiveRag(checked)}
                />
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna izquierda: carga */}
          <Card className="rounded-xl border bg-card">
            <CardHeader>
              <CardTitle>Subir archivos</CardTitle>
              <CardDescription>Arrastra y suelta o selecciona archivos. Luego pulsa actualizar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DropzoneButton id="rag-dropzone" multiple onChange={(e) => onDropChange(e.target.files)} />
              {selectedFiles.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Seleccionados ({selectedFiles.length})</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedFiles.map((f) => (
                      <div key={f.name + f.size} className="flex items-center gap-3 rounded-lg border border-muted-foreground/20 bg-background px-3 py-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-muted/30">
                          {(() => {
                            const name = String(f.name || "").toLowerCase()
                            const ext = name.split(".").pop()
                            const type = String(f.type || "").toLowerCase()
                            const isPdf = ext === "pdf" || type.includes("application/pdf")
                            const isXls = ext === "xls" || type.includes("application/vnd.ms-excel")
                            const isXlsx = ext === "xlsx" || type.includes("openxmlformats-officedocument.spreadsheetml.sheet")
                            const isTxt = ext === "txt" || type.includes("text/plain")
                            if (isPdf) return <FileTextIcon className="h-4 w-4 text-red-600" />
                            if (isXls || isXlsx) return <FileSpreadsheetIcon className="h-4 w-4 text-emerald-600" />
                            if (isTxt) return <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                            return <FileIcon className="h-4 w-4 text-muted-foreground" />
                          })()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium" title={f.name}>{f.name}</div>
                          <div className="text-xs text-muted-foreground">{formatBytes(f.size)}</div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeSelected(f)} aria-label="Quitar" className="shrink-0">
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex items-center justify-end">
                <Button className="w-full sm:w-auto" disabled={!canUpdate || saving || !selectedFiles.length} onClick={handleUpdate}>
                  {saving ? "Actualizando..." : "Actualizar"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Columna derecha: tabla */}
          <Card className="rounded-xl border bg-card">
            <CardHeader>
              <CardTitle>Archivos subidos</CardTitle>
              <CardDescription>Listado de archivos asociados al chatbot.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fecha de subida</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-sm text-muted-foreground">Sin archivos</TableCell>
                    </TableRow>
                  ) : (
                    files.map((f) => (
                      <TableRow key={f.id || f.url}>
                        <TableCell>
                          <div className="h-9 w-9 rounded-md border bg-muted/30 flex items-center justify-center">
                            {(() => {
                              const name = String(f.name || "").toLowerCase()
                              const ext = name.split(".").pop()
                              const mime = String(f.mime || "").toLowerCase()
                              const isPdf = ext === "pdf" || mime.includes("application/pdf")
                              const isXls = ext === "xls" || mime.includes("application/vnd.ms-excel")
                              const isXlsx = ext === "xlsx" || mime.includes("openxmlformats-officedocument.spreadsheetml.sheet")
                              const isTxt = ext === "txt" || mime.includes("text/plain")
                              if (isPdf) return <FileTextIcon className="h-4 w-4 text-red-600" />
                              if (isXls || isXlsx) return <FileSpreadsheetIcon className="h-4 w-4 text-emerald-600" />
                              if (isTxt) return <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                              return <FileIcon className="h-4 w-4 text-muted-foreground" />
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="truncate max-w-[22rem]">
                          <a href={f.url || "#"} target="_blank" rel="noreferrer" className="hover:underline">
                            {f.name || "Archivo"}
                          </a>
                        </TableCell>
                        <TableCell>{formatDate(f.createdAt)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => setToDelete(f.id)} aria-label="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      <AlertDialog open={!!toDelete} onOpenChange={(open) => (open ? null : setToDelete(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar archivo</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">¿Seguro que deseas eliminar este archivo? Esta acción no se puede deshacer.</p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleRemove(toDelete)} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
const ACCEPT = "application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
