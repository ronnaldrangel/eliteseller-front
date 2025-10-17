"use client"

import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

export const columns = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <div
        className="inline-flex items-center gap-1 cursor-pointer select-none"
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
       const id = row.original?.id
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
             <DropdownMenuItem onClick={() => console.log("Editar producto", id)}>
               Editar
             </DropdownMenuItem>
             <DropdownMenuSeparator />
             <DropdownMenuItem className="text-destructive" onClick={() => console.log("Eliminar producto", id)}>
               Eliminar
             </DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
       )
     },
     enableSorting: false,
   },

]