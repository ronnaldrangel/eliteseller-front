"use client";

import { useEffect, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function ContactsDataTable({
  columns,
  data,
  queryFilter = "",
  saleStatusFilter = "all",
  hotnessFilter = "all",
  fbAdsFilter = "all",
  dateFrom = "",
  dateTo = "",
  pageSize = 20,
}) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [page, setPage] = useState(1);

  const parseDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const normalizeBoundary = (value, endOfDay = false) => {
    const d = parseDate(value);
    if (!d) return null;
    if (endOfDay) {
      d.setHours(23, 59, 59, 999);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    return d;
  };

  const extractContactDate = (row) => {
    if (!row) return null;
    const candidates = [
      row.last_message_time,
      row.last_message_at,
      row.last_message_date,
      row.last_message,
      row.createdAt,
      row.created_at,
      row.createdStamp,
      row.created_stamp,
      row.attributes?.createdAt,
      row.attributes?.created_at,
    ];

    for (const candidate of candidates) {
      const parsed = parseDate(candidate);
      if (parsed) return parsed;
    }
    return null;
  };

  const filteredData = data?.filter?.((row) => {
    const start = normalizeBoundary(dateFrom, false);
    const end = normalizeBoundary(dateTo, true);
    if (!start && !end) return true;
    const rowDate = extractContactDate(row);
    if (!rowDate) return false;
    if (start && rowDate < start) return false;
    if (end && rowDate > end) return false;
    return true;
  }) ?? [];

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    setColumnFilters([
      { id: "name", value: queryFilter },
      { id: "sale_status_flag", value: saleStatusFilter },
      { id: "hotness", value: hotnessFilter },
      { id: "fb_ads_id", value: fbAdsFilter },
    ]);
  }, [queryFilter, saleStatusFilter, hotnessFilter, fbAdsFilter]);

  useEffect(() => {
    setPage(1);
  }, [
    queryFilter,
    saleStatusFilter,
    hotnessFilter,
    fbAdsFilter,
    dateFrom,
    dateTo,
    filteredData.length,
  ]);

  const rows = table.getRowModel().rows;
  const totalRows = rows.length;
  const totalPages = totalRows ? Math.ceil(totalRows / pageSize) : 1;
  const currentPage = Math.min(page, totalPages || 1);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageRows = rows.slice(startIndex, endIndex);
  const showingFrom = totalRows ? startIndex + 1 : 0;
  const showingTo = totalRows ? Math.min(endIndex, totalRows) : 0;

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="whitespace-nowrap">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {pageRows?.length ? (
            pageRows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Sin resultados. Ajusta la busqueda o limpia los filtros.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {showingFrom}-{showingTo} de {totalRows} contactos
        </p>
        <Pagination className="w-full justify-end sm:w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="cursor-pointer"
                aria-disabled={currentPage === 1}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink isActive className="pointer-events-none">
                {currentPage} / {totalPages}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                className="cursor-pointer"
                aria-disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
