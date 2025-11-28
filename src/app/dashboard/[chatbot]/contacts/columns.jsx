"use client";

import {
  ArrowUpDown,
  CheckCircle2,
  Flame,
  Snowflake,
  Sprout,
  XCircle,
} from "lucide-react";

const textContains = (row, id, value) => {
  const search = String(value || "").trim().toLowerCase();
  if (!search) return true;
  const cellValue = String(row.getValue(id) ?? "").toLowerCase();
  return cellValue.includes(search);
};

const searchNameOrPhone = (row, _id, value) => {
  const search = String(value || "").trim().toLowerCase();
  if (!search) return true;
  const name = String(row.getValue("name") ?? "").toLowerCase();
  const phone = String(row.getValue("customer_phone_name") ?? "").toLowerCase();
  return name.includes(search) || phone.includes(search);
};

const booleanFromMixed = (value) => {
  if (typeof value === "boolean") return value;
  return value === "true" || value === 1 || value === "1" || value === "yes";
};

const saleStatusFilter = (row, id, value) => {
  if (!value || value === "all") return true;
  const isClosed = booleanFromMixed(row.getValue(id));
  return value === "won" ? isClosed : !isClosed;
};

const matchExactValue = (row, id, value) => {
  if (!value || value === "all") return true;
  const cellValue = String(row.getValue(id) ?? "").trim().toLowerCase();
  return cellValue === String(value).trim().toLowerCase();
};

const fbAdsFilter = (row, id, value) => {
  if (!value || value === "all") return true;
  const hasId = Boolean(row.getValue(id));
  return value === "with" ? hasId : !hasId;
};

const saleStatusDisplay = (value) => {
  const b = booleanFromMixed(value);
  return b
    ? { icon: CheckCircle2, label: "Si", className: "text-green-600" }
    : { icon: XCircle, label: "No", className: "text-red-600" };
};

const hotnessDisplay = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  switch (normalized) {
    case "hot":
      return { icon: Flame, label: "Hot" };
    case "cold":
      return { icon: Snowflake, label: "Cold" };
    case "normal":
      return { icon: Sprout, label: "Normal" };
    default:
      return { icon: null, label: value || "-" };
  }
};

const formatDateTime = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const dateStr = d.toLocaleDateString();
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${dateStr} (${timeStr})`;
};

export const columns = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <div
        className="inline-flex items-center gap-1 cursor-pointer select-none pl-4"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nombre <ArrowUpDown className="ml-1 h-3 w-3" />
      </div>
    ),
    cell: ({ row }) => (
      <span className="font-medium pl-4">{row.getValue("name") || "-"}</span>
    ),
    filterFn: searchNameOrPhone,
  },
  {
    accessorKey: "customer_phone_name",
    header: ({ column }) => (
      <div
        className="inline-flex items-center gap-1 cursor-pointer select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Telefono / Cliente <ArrowUpDown className="ml-1 h-3 w-3" />
      </div>
    ),
    cell: ({ row }) => {
      const val = row.getValue("customer_phone_name");
      return <span className="text-muted-foreground">{val || "-"}</span>;
    },
    filterFn: textContains,
  },
  {
    accessorKey: "hotness",
    header: ({ column }) => (
      <div
        className="inline-flex items-center gap-1 cursor-pointer select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Interes <ArrowUpDown className="ml-1 h-3 w-3" />
      </div>
    ),
    cell: ({ row }) => {
      const val = row.getValue("hotness");
      const { icon: Icon, label } = hotnessDisplay(val);
      return (
        <span className="flex items-center gap-2 truncate max-w-[280px]">
          {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
          <span className="truncate">{label}</span>
        </span>
      );
    },
    filterFn: matchExactValue,
  },
  {
    accessorKey: "last_message",
    header: ({ column }) => (
      <div
        className="inline-flex items-center gap-1 cursor-pointer select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Ultimo mensaje <ArrowUpDown className="ml-1 h-3 w-3" />
      </div>
    ),
    cell: ({ row }) => {
      const rawMessage = row.getValue("last_message");
      const timeRaw =
        row.original?.last_message_time ||
        row.original?.last_message_at ||
        row.original?.last_message_date ||
        "";
      const timeText = typeof timeRaw === "string" ? timeRaw.trim() : "";
      const messageText = rawMessage || "";
      const formattedMessage = formatDateTime(rawMessage);
      const formattedTime = formatDateTime(timeText);

      let display = "-";
      if (formattedMessage && (!messageText || messageText === timeText)) {
        display = formattedMessage;
      } else if (messageText && formattedTime) {
        display = `${messageText} (${formattedTime})`;
      } else if (formattedTime) {
        display = formattedTime;
      } else if (messageText || timeText) {
        display =
          messageText && timeText ? `${messageText} (${timeText})` : messageText || timeText;
      }

      return (
        <span className="truncate max-w-[320px] block text-muted-foreground">
          {display}
        </span>
      );
    },
    filterFn: textContains,
  },
  {
    accessorKey: "fb_ads_id",
    header: ({ column }) => (
      <div
        className="inline-flex items-center gap-1 cursor-pointer select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        FB Ads ID <ArrowUpDown className="ml-1 h-3 w-3" />
      </div>
    ),
    cell: ({ row }) => {
      const val = row.getValue("fb_ads_id");
      return (
        <span className="truncate max-w-[220px] block text-muted-foreground">
          {val || "-"}
        </span>
      );
    },
    filterFn: fbAdsFilter,
  },
  {
    accessorKey: "sale_status_flag",
    header: ({ column }) => (
      <div
        className="inline-flex items-center gap-1 cursor-pointer select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Venta realizada? <ArrowUpDown className="ml-1 h-3 w-3" />
      </div>
    ),
    cell: ({ row }) => {
      const v = row.getValue("sale_status_flag");
      const { icon: Icon, label, className } = saleStatusDisplay(v);
      return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{label}</span>
          <span aria-hidden="true">{label}</span>
        </span>
      );
    },
    filterFn: saleStatusFilter,
  },
];
