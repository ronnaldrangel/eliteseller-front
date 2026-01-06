"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Bot,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { analyticsService } from "@/services/analytics.service";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ITEMS_PER_PAGE = 10;

export function UsersView() {
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await analyticsService.getUsersWithDetails();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const toggleRow = (userId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    let result = Array.isArray(users) ? users : [];

    // Map backend fields to frontend format
    const mappedUsers = result.map((u) => ({
      id: u.id,
      documentId: u.documentId,
      username: u.username,
      email: u.email,
      provider: u.provider,
      confirmed: u.confirmed,
      customer: u.customer,
      chatbots: u.chatbots || [],
      // Strapi usually returns createdAt
      joined: u.createdAt
        ? new Date(u.createdAt).toISOString().split("T")[0]
        : "N/A",
      status: u.confirmed ? "Confirmed" : "Unconfirmed",
    }));

    if (userFilter === "all") return mappedUsers;

    const now = new Date();
    const days = userFilter === "30d" ? 30 : 7;
    const cutoff = new Date(now.setDate(now.getDate() - days));

    return mappedUsers.filter((u) => {
      if (u.joined === "N/A") return false;
      const joinedDate = new Date(u.joined);
      return joinedDate >= cutoff;
    });
  }, [userFilter, users]);

  const handleExport = () => {
    if (!filteredUsers || filteredUsers.length === 0) return;

    const doc = new jsPDF();
    doc.text("User Database Export", 14, 20);

    const tableColumn = [
      "ID",
      "Username",
      "Email",
      "Provider",
      "Status",
      "Chatbots",
    ];
    const tableRows = filteredUsers.map((user) => [
      user.id,
      user.username,
      user.email,
      user.provider,
      user.status,
      user.chatbots.length,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
    });

    doc.save(`users_export_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [userFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Database</h2>
          <p className="text-muted-foreground">
            Vista de administracion de usuarios  (Strapi).
          </p>
        </div>
        <Button
          variant="outline"
          className="hidden sm:flex"
          onClick={handleExport}
          disabled={loading || filteredUsers.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {/* <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <ToggleGroup
            type="single"
            value={userFilter}
            onValueChange={(val) => val && setUserFilter(val)}
            variant="outline"
          >
            <ToggleGroupItem value="all" className="rounded-xl px-4">
              All Users
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="rounded-xl px-4">
              New (30d)
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="rounded-xl px-4">
              New (7d)
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-8 rounded-xl"
              />
            </div>
            <Button variant="outline" size="icon" className="rounded-xl">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div> */}

        {/* Pagination buttons */}

        {filteredUsers.length > 0 && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({filteredUsers.length} users)
            </div>
            <div className="space-x-2 items-center flex">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Atras
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Chatbots</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <TableRow
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        expandedRows.has(user.id) ? "bg-muted/50" : ""
                      }`}
                      onClick={() => toggleRow(user.id)}
                    >
                      <TableCell>
                        {expandedRows.has(user.id) ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">#{user.id}</TableCell>
                      <TableCell className="font-semibold">
                        {user.username}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="rounded-lg capitalize"
                        >
                          {user.provider}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`rounded-lg ${
                            user.confirmed
                              ? "text-green-600 border-green-200 bg-green-50"
                              : "text-amber-600 border-amber-200 bg-amber-50"
                          }`}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {user.chatbots.length}
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(user.id) && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={7} className="p-0">
                          <div className="p-4 sm:p-6 grid gap-6 md:grid-cols-2 border-t">
                            {/* Payment / Customer Details */}
                            <div className="space-y-4">
                              <h3 className="text-sm font-medium flex items-center gap-2 text-primary">
                                <CreditCard className="h-4 w-4" />
                                Informacion de Pago
                              </h3>
                              {user.customer ? (
                                <div className="bg-background rounded-xl border p-4 shadow-sm space-y-3">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">
                                      Customer ID
                                    </span>
                                    <span className="">
                                      {user.customer.customerId}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">
                                      Modo de Pago
                                    </span>
                                    <Badge variant="outline">
                                      {user.customer.pay_mode}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">
                                      Informacion de la tarjeta
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {user.customer.creditCardType}
                                      </span>
                                      <span className=" text-xs">
                                        •••• {user.customer.last4CardDigits}
                                      </span>
                                    </div>
                                  </div>
                                  {/* <div className="pt-2 border-t mt-2 flex justify-between items-center text-xs text-muted-foreground">
                                                                    <span>Internal ID: {user.customer.id}</span>
                                                                    <span>Doc: {user.customer.documentId?.substring(0, 8)}...</span>
                                                                </div> */}
                                </div>
                              ) : (
                                <div className="bg-background/50 rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
                                  No perfil de facturacion adjuntado.
                                </div>
                              )}
                            </div>

                            {/* Chatbots Summary */}
                            <div className="space-y-4">
                              <h3 className="text-sm font-medium flex items-center gap-2 text-primary">
                                <Bot className="h-4 w-4" />
                                Resumen de Chatbots
                              </h3>
                              {user.chatbots.length > 0 ? (
                                <div className="grid gap-3">
                                  {user.chatbots.map((bot) => (
                                    <div
                                      key={bot.id}
                                      className="bg-background rounded-xl border p-4 shadow-sm flex flex-col gap-2"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="font-medium text-sm flex items-center gap-2">
                                          {bot.chatbot_name}
                                          {bot.enable_chatbot ? (
                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                          ) : (
                                            <XCircle className="h-3 w-3 text-red-400" />
                                          )}
                                        </div>
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px] h-5"
                                        >
                                          ID: {bot.id}
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate  bg-muted/50 p-1 rounded">
                                        {bot.slug}
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 mt-1">
                                        <div className="bg-slate-50 dark:bg-stone-900 p-3 rounded-lg">
                                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                            Used
                                          </p>
                                          <p className="text-sm font-medium">
                                            {parseInt(
                                              bot.tokens_used || 0
                                            ).toLocaleString()}
                                          </p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-stone-900 p-3 rounded-lg">
                                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                            Remaining
                                          </p>
                                          <p className="text-sm font-medium">
                                            {parseInt(
                                              bot.tokens_remaining || 0
                                            ).toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="bg-background/50 rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
                                  No chatbots created yet.
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No users found for this filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
