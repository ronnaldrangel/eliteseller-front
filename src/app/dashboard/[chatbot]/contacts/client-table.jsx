"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContactsDataTable } from "./data-table";

export function ContactsClientTable({ columns, data }) {
  const [query, setQuery] = useState("");
  const [saleStatus, setSaleStatus] = useState("all");
  const [hotness, setHotness] = useState("all");
  const [fbAds, setFbAds] = useState("all");

  const hotnessOptions = useMemo(() => {
    const unique = new Set();
    data?.forEach?.((item) => {
      const val = String(item?.hotness || "").trim();
      if (val) unique.add(val);
    });
    return Array.from(unique);
  }, [data]);



  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2 sm:col-span-2 lg:col-span-2">
            <Label htmlFor="contact-search">Buscar contactos</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="contact-search"
                placeholder="Buscar por nombre o telefono"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                aria-describedby="contact-search-help"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale-status-filter">Estado de venta</Label>
            <Select
              value={saleStatus}
              onValueChange={setSaleStatus}
              aria-label="Filtrar por venta realizada"
            >
              <SelectTrigger id="sale-status-filter" className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="won">Venta realizada</SelectItem>
                <SelectItem value="open">Sin venta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hotness-filter">Interes</Label>
            <Select
              value={hotness}
              onValueChange={setHotness}
              aria-label="Filtrar por nivel de interes"
            >
              <SelectTrigger id="hotness-filter" className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {hotnessOptions.length === 0 ? (
                  <SelectItem value="__empty" disabled>
                    Sin opciones
                  </SelectItem>
                ) : (
                  hotnessOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fbads-filter">ID de FB Ads</Label>
            <Select
              value={fbAds}
              onValueChange={setFbAds}
              aria-label="Filtrar por presencia de FB Ads ID"
            >
              <SelectTrigger id="fbads-filter" className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with">Con ID</SelectItem>
                <SelectItem value="without">Sin ID</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ContactsDataTable
        columns={columns}
        data={data}
        queryFilter={query}
        saleStatusFilter={saleStatus}
        hotnessFilter={hotness}
        fbAdsFilter={fbAds}
      />
    </div>
  );
}
