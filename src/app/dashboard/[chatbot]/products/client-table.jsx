"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { ProductsDataTable } from "./data-table"

export function ProductsClientTable({ columns, data }) {
  const [nameFilter, setNameFilter] = useState("")

  return (
    <div className="flex flex-col gap-3">
      {/* Buscador arriba y fuera de la tabla, al 100% */}
      <Input
        placeholder="Buscar por nombre…"
        className="w-full"
        value={nameFilter}
        onChange={(e) => setNameFilter(e.target.value)}
      />

      <ProductsDataTable columns={columns} data={data} nameFilter={nameFilter} />
    </div>
  )
}