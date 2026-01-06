"use client"

import React, { useState, useEffect } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Bot, CheckCircle, XCircle, Globe, Building2 } from "lucide-react"
import { analyticsService } from "@/services/analytics.service"

export function ChatbotsView() {
    const [chatbots, setChatbots] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchChatbots = async () => {
            try {
                const data = await analyticsService.getChatbots()
                setChatbots(data.data || [])
            } catch (error) {
                console.error("Error fetching chatbots:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchChatbots()
    }, [])

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Chatbots</h2>
                <p className="text-muted-foreground">Gestión de chatbots de IA.</p>
            </div>

            <div className="rounded-2xl border shadow-sm overflow-hidden">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre del Chatbot</TableHead>
                                    <TableHead>Empresa</TableHead>
                                    <TableHead>País</TableHead>
                                    <TableHead>Tokens Restantes</TableHead>
                                    <TableHead>Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Cargando chatbots...
                                        </TableCell>
                                    </TableRow>
                                ) : chatbots.length > 0 ? (
                                    chatbots.map((bot, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Bot className="h-4 w-4 text-muted-foreground" />
                                                    {bot.chatbot_name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    {bot.company_name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {bot.country && (
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                                        {bot.country}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {parseInt(bot.tokens_remaining || 0).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`gap-1 ${
                                                        bot.enable_chatbot
                                                            ? "text-green-600 border-green-200 bg-green-50"
                                                            : "text-red-600 border-red-200 bg-red-50"
                                                    }`}
                                                >
                                                    {bot.enable_chatbot ? (
                                                        <>
                                                            <CheckCircle className="h-3 w-3" />
                                                            Habilitado
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-3 w-3" />
                                                            Deshabilitado
                                                        </>
                                                    )}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No se encontraron chatbots.
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
