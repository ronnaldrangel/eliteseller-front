"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { ProductsDataTable } from "./data-table"

export function ProductsClientTable({ columns, data }) {
  const [nameFilter, setNameFilter] = useState("")
  const router = useRouter()

  // Escuchar evento de actualización de productos
  useEffect(() => {
    const handleProductsUpdated = () => {
      if (typeof router.refresh === 'function') {
        router.refresh()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('products:updated', handleProductsUpdated)
      return () => window.removeEventListener('products:updated', handleProductsUpdated)
    }
  }, [router])

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