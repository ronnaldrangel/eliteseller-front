"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
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

  const resetFilters = () => {
    setQuery("");
    setSaleStatus("all");
    setHotness("all");
    setFbAds("all");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border bg-card/50 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1 space-y-2">
            <Label htmlFor="contact-search">Buscar contactos</Label>
            <InputGroup className="bg-background">
              <InputGroupAddon aria-hidden="true">
                <Search className="h-4 w-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                id="contact-search"
                placeholder="Buscar por nombre o telefono"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-describedby="contact-search-help"
              />
            </InputGroup>
            <p
              id="contact-search-help"
              className="text-xs text-muted-foreground"
            >
              Busca por nombre o telefono. Los filtros reducen los resultados sin perder el contexto de la tabla.
            </p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-center lg:w-auto"
            onClick={resetFilters}
          >
            Limpiar filtros
          </Button>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
