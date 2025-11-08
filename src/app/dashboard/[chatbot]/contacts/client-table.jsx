"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ContactsDataTable } from "./data-table";

export function ContactsClientTable({ columns, data }) {
  const [nameFilter, setNameFilter] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Buscar por nombre…"
        className="w-full"
        value={nameFilter}
        onChange={(e) => setNameFilter(e.target.value)}
      />

      <ContactsDataTable
        columns={columns}
        data={data}
        nameFilter={nameFilter}
      />
    </div>
  );
}
