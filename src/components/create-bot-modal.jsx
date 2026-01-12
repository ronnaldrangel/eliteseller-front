"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, Loader2 } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { buildChatbotIdentifiers } from "@/lib/utils/chatbot-route"

export default function CreateBotModal({ strapiToken, userId, strapiUrl }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        try {
            const res = await fetch(`${strapiUrl}/api/chatbots`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${strapiToken}`,
                },
                body: JSON.stringify({
                    data: {
                        chatbot_name: name,
                        users_permissions_user: userId,
                    },
                }),
            })

            if (!res.ok) {
                throw new Error("Error al crear el bot")
            }

            const data = await res.json()
            // Strapi v4 response: { data: { id: 1, attributes: { ... } } }
            // Strapi v5 might be different, but let's assume standard response structure or flat if configured.

            const createdBot = data.data

            const { routeSegment } = buildChatbotIdentifiers(createdBot, userId)

            setOpen(false)
            router.push(`/dashboard/${encodeURIComponent(routeSegment)}/home`)
            router.refresh()

        } catch (error) {
            console.error(error)
            alert("Error al crear el bot")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    className="group rounded-lg border bg-card p-6 aspect-square flex flex-col items-center justify-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-accent/30"
                    aria-label="Crear bot"
                    title="Crear bot"
                >
                    <PlusIcon className="size-16 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="mt-3 text-sm md:text-base font-semibold">Crear bot</div>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[380px]">
                <form onSubmit={handleCreate}>
                    <DialogHeader>
                        <DialogTitle>Crear nuevo chatbot</DialogTitle>
                        <DialogDescription>
                            Ingresa el nombre para tu nuevo asistente virtual.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="name">
                                Nombre
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Mi Bot"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Bot
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
