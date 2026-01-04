"use client"

import React from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Bot, Construction } from "lucide-react"

export function ChatbotsView() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Chatbots</h2>
                <p className="text-muted-foreground">Manage AI chatbots (Coming Soon).</p>
            </div>

            <Card className="rounded-[2rem] border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-6 w-6" />
                        Chatbot Management
                    </CardTitle>
                    <CardDescription>
                        Configuration and analytics for chatbots.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-4">
                    <Construction className="h-16 w-16 opacity-20" />
                    <p>This module is currently under construction.</p>
                </CardContent>
            </Card>
        </div>
    )
}
