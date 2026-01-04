"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Search, Filter, Download } from "lucide-react"
import { paymentsService } from "@/services/payments.service"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export function UsersView() {
    const [users, setUsers] = useState([]);
    const [userFilter, setUserFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const customers = await paymentsService.getCustomers();
                setUsers(customers);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        let result = [...users];

        // Map backend fields to frontend format
        const mappedUsers = result.map(u => ({
            id: u.customerId,
            name: u.name,
            email: u.email,
            // Mock missing fields for now
            plan: "Pro",
            status: u.status === 1 ? "Active" : "Inactive",
            joined: (u.registerDate || u.created || "").split(' ')[0] || "N/A",
            amount: "$0.00"
        }));

        if (userFilter === 'all') return mappedUsers;

        const now = new Date();
        const days = userFilter === '30d' ? 30 : 7;
        const cutoff = new Date(now.setDate(now.getDate() - days));

        return mappedUsers.filter(u => {
            const joinedDate = new Date(u.joined);
            return joinedDate >= cutoff;
        });

    }, [userFilter, users]);

    const handleExport = () => {
        if (!filteredUsers || filteredUsers.length === 0) return;

        const sortedUsers = [...filteredUsers].sort((a, b) => {
            const dateA = new Date(a.joined === "N/A" ? 0 : a.joined);
            const dateB = new Date(b.joined === "N/A" ? 0 : b.joined);
            return dateB - dateA;
        });

        const doc = new jsPDF();
        doc.text("User Database Export", 14, 20);

        const tableColumn = ["User ID", "Name", "Email", "Plan", "Status", "Joined", "Amount"];
        const tableRows = sortedUsers.map(user => [
            user.id,
            user.name,
            user.email,
            user.plan,
            user.status,
            user.joined,
            user.amount
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 25,
        });

        doc.save(`users_export_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                     <h2 className="text-3xl font-bold tracking-tight">User Database</h2>
                      <p className="text-muted-foreground">View and manage all registered users.</p>
                </div>
                <Button variant="outline" className="hidden sm:flex" onClick={handleExport} disabled={loading || filteredUsers.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                </Button>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <ToggleGroup type="single" value={userFilter} onValueChange={(val) => val && setUserFilter(val)} variant="outline">
                        <ToggleGroupItem value="all" className="rounded-xl px-4">All Users</ToggleGroupItem>
                        <ToggleGroupItem value="30d" className="rounded-xl px-4">New (30d)</ToggleGroupItem>
                        <ToggleGroupItem value="7d" className="rounded-xl px-4">New (7d)</ToggleGroupItem>
                    </ToggleGroup>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar por nombre o email..." className="pl-8 rounded-xl" />
                        </div>
                        <Button variant="outline" size="icon" className="rounded-xl">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                
                <div className="rounded-2xl border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>User ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden md:table-cell">Email</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell">Joined</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">Loading users...</TableCell>
                                </TableRow>
                            ) : filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.id}</TableCell>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.plan === "Enterprise" ? "default" : "secondary"} className="rounded-lg">
                                            {user.plan}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`rounded-lg ${user.status === "Active" ? "text-green-600 border-green-200 bg-green-50" : "text-red-600 border-red-200 bg-red-50"
                                            }`}>
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{user.joined}</TableCell>
                                    <TableCell className="text-right font-medium">{user.amount}</TableCell>
                                </TableRow>
                            )) : (
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
    )
}
