"use client";

import { ArrowUpDown } from "lucide-react";

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
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name") || "-"}</span>
    ),
  },
  {
    accessorKey: "customer_phone_name",
    header: ({ column }) => (
      <div
        className="inline-flex items-center gap-1 cursor-pointer select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Teléfono / Cliente <ArrowUpDown className="ml-1 h-3 w-3" />
      </div>
    ),
    cell: ({ row }) => {
      const val = row.getValue("customer_phone_name");
      return <span className="text-muted-foreground">{val || "-"}</span>;
    },
  },
  {
    accessorKey: "hotness",
    header: ({ column }) => (
      <div
        className="inline-flex items-center gap-1 cursor-pointer select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Hotness <ArrowUpDown className="ml-1 h-3 w-3" />
      </div>
    ),
    cell: ({ row }) => {
      const text = row.getValue("hotness") || "";
      return (
        <span className="truncate max-w-[280px] block">{text || "-"}</span>
      );
    },
  },
  {
    accessorKey: "sale_status_flag",
    header: ({ column }) => (
      <div
        className="inline-flex items-center gap-1 cursor-pointer select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        ¿Venta realizada? <ArrowUpDown className="ml-1 h-3 w-3" />
      </div>
    ),
    cell: ({ row }) => {
      const v = row.getValue("sale_status_flag");
      const b =
        typeof v === "boolean" ? v : v === "true" || v === 1 || v === "1";
      return (
        <span className={b ? "text-green-600" : "text-red-600"}>
          {b ? "Sí" : "No"}
        </span>
      );
    },
  },
];
