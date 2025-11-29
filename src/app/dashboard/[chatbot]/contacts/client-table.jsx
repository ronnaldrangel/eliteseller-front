"use client";

import { useMemo, useState } from "react";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
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


  const handleExport = () => {
    if (!data || !data.length) return;

    const headers = [
      "ID",
      "Name",
      "Phone/Customer",
      "Hotness",
      "Last Message",
      "Last Message Time",
      "FB Ads ID",
      "Sale Status",
    ];

    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        [
          row.id,
          `"${(row.name || "").replace(/"/g, '""')}"`,
          `"${(row.customer_phone_name || "").replace(/"/g, '""')}"`,
          row.hotness,
          `"${(row.last_message || "").replace(/"/g, '""')}"`,
          row.last_message_time || "",
          row.fb_ads_id || "",
          row.sale_status_flag ? "Yes" : "No",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "contacts_export.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
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
              <SelectTrigger id="sale-status-filter" className="w-full h-10">
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
              <SelectTrigger id="hotness-filter" className="w-full h-10">
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
              <SelectTrigger id="fbads-filter" className="w-full h-10">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with">Con ID</SelectItem>
                <SelectItem value="without">Sin ID</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              className="h-10 gap-2 px-3 text-xs"
              onClick={handleExport}
            >
              <Download className="h-3.5 w-3.5" />
              Exportar
            </Button>
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
