"use client"

import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export const columns = [
  {
    id: "thumbnail",
    header: "",
    cell: ({ row }) => {
      const media = row.original?.media
      const thumbUrl = Array.isArray(media) && media.length > 0 ? media[0]?.url : null
      return (
        <div className="flex items-center">
          {thumbUrl ? (
            <img src={thumbUrl} alt={row.original?.name || "Producto"} className="h-12 w-12 rounded-md object-cover border" />
          ) : (
            <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">N/A</div>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <div
        className="inline-flex items-center gap-1 select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nombre <ArrowUpDown className="ml-1 h-3 w-3" />
      </div>
    ),
    cell: ({ row }) => {
      const name = row.getValue("name")
      return <span className="font-medium">{name || "-"}</span>
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <div
        className="inline-flex items-center gap-1 cursor-pointer select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Precio <ArrowUpDown className="ml-1 h-3 w-3" />
      </div>
    ),
    cell: ({ row }) => {
      const val = row.getValue("price")
      const n = typeof val === "number" ? val : Number(val)
      return (
        <span>
          {Number.isFinite(n)
            ? n.toLocaleString("es-ES", { style: "currency", currency: "USD" })
            : "-"}
        </span>
      )
    },
  },
  {
    accessorKey: "available",
    header: ({ column }) => (
      <div
        className="inline-flex items-center gap-1 cursor-pointer select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Disponible <ArrowUpDown className="ml-1 h-3 w-3" />
      </div>
    ),
    cell: ({ row }) => {
      const available = row.getValue("available")
      const b = typeof available === "boolean" ? available : available === "true" || available === 1
      return <span className={b ? "text-green-600" : "text-red-600"}>{b ? "Sí" : "No"}</span>
    },
  },
  {
    accessorKey: "stock",
    header: ({ column }) => (
      <div
        className="inline-flex items-center gap-1 cursor-pointer select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Stock <ArrowUpDown className="ml-1 h-3 w-3" />
      </div>
    ),
    cell: ({ row }) => {
      const val = row.getValue("stock")
      const n = typeof val === "number" ? val : Number(val)
      return <span>{Number.isFinite(n) ? n.toLocaleString("es-ES") : "-"}</span>
    },
  },
  {
     id: "actions",
     header: "Acciones",
     cell: ({ row }) => {
        const router = useRouter()
        const id = row.original?.id
        const documentId = row.original?.documentId || row.original?.attributes?.documentId || id
        const handleEdit = () => {
          const docId = row.original?.documentId || row.original?.attributes?.documentId || id
          if (!docId) return
          const base = typeof window !== "undefined" ? window.location.pathname : "/dashboard"
          router.push(`${base}/${encodeURIComponent(docId)}/edit`)
        }
        const handleDelete = async () => {
          if (!documentId) return
          const ok = typeof window !== "undefined" ? window.confirm("¿Eliminar este producto?") : true
          if (!ok) return
          try {
            const res = await fetch(`/api/products/${documentId}`, { method: "DELETE" })
            const body = await res.json().catch(() => ({}))
            if (!res.ok) {
              const msg = body?.error?.message || "No se pudo eliminar el producto"
              toast.error(msg)
              return
            }
            toast.success("Eliminado")
            router.refresh()
          } catch (e) {
            toast.error("Error de red al eliminar")
          }
        }
       return (
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="ghost" className="h-8 w-8 p-0">
               <span className="sr-only">Abrir menú</span>
               <MoreHorizontal className="h-4 w-4" />
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end">
             <DropdownMenuLabel>Acciones</DropdownMenuLabel>
             <DropdownMenuItem onClick={handleEdit}>
               Editar
             </DropdownMenuItem>
             <DropdownMenuSeparator />
             <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
               Eliminar
             </DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
       )
     },
     enableSorting: false,
   },

]