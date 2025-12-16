"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2, Plus, Mic, Image as ImageIcon, Paperclip, X, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// TODO: Replace with your actual n8n webhook URL
const WEBHOOK_URL = "https://bot.eliteseller.app/webhook/17250cba-5a2d-4826-a471-0dcf889704d7/chat";

export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState("gemini-1.5-pro");
    const [attachments, setAttachments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const scrollAreaRef = useRef(null);
    const bottomRef = useRef(null);
    const sessionId = useRef("");
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Scroll to bottom whenever messages change
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        if (!sessionId.current) {
            sessionId.current =
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
        }
    }, []);

    const handleFileSelect = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const uploadedUrls = [];

        for (const file of files) {
            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) throw new Error("Upload failed");

                const data = await res.json();
                uploadedUrls.push({
                    name: file.name,
                    type: file.type,
                    url: data.url
                });
                toast.success(`Archivo ${file.name} subido correctamente`);
            } catch (error) {
                console.error("Upload error:", error);
                toast.error(`Error al subir ${file.name} `);
            }
        }

        setAttachments((prev) => [...prev, ...uploadedUrls]);
        setIsUploading(false);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeAttachment = (index) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleNewChat = () => {
        setMessages([]);
        setInput("");
        setAttachments([]);
        sessionId.current = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    const handleSubmit = async (e, customInput) => {
        if (e) e.preventDefault();
        const messageToSend = customInput || input;
        if ((!messageToSend.trim() && attachments.length === 0) || isLoading || isUploading) return;

        setInput("");
        const sentAttachments = [...attachments];
        setAttachments([]);

        // Add user message
        const newMessages = [
            ...messages,
            {
                role: "user",
                content: messageToSend,
                attachments: sentAttachments
            },
        ];
        setMessages(newMessages);
        setIsLoading(true);

        // Initial placeholder removed

        try {
            const response = await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    chatInput: messageToSend,
                    sessionId: sessionId.current,
                    model: selectedModel,
                    attachments: sentAttachments.map(a => a.url),
                    history: newMessages.map(m => ({
                        role: m.role,
                        content: m.content,
                        // Map attachments if needed for history context
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status} `);
            }

            if (!response.body) {
                throw new Error("ReadableStream not supported by browser.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let streamedResponse = "";
            let buffer = "";

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value, { stream: true });
                buffer += chunkValue;

                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const json = JSON.parse(line);
                        if (json.type === "item" && json.content) {
                            streamedResponse += json.content;
                            const currentText = streamedResponse;

                            setMessages((prev) => {
                                const lastMsg = prev[prev.length - 1];
                                if (lastMsg && lastMsg.role === "assistant") {
                                    // Update existing assistant message
                                    const updated = [...prev];
                                    updated[updated.length - 1] = {
                                        role: "assistant",
                                        content: currentText,
                                        model: selectedModel
                                    };
                                    return updated;
                                } else {
                                    // Append new assistant message (first chunk)
                                    return [
                                        ...prev,
                                        { role: "assistant", content: currentText, model: selectedModel },
                                    ];
                                }
                            });
                        }
                    } catch (e) {
                        console.warn("Failed to parse JSON stream line", line, e);
                    }
                }
            }
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Error al conectar con el agente. Verifica la conexión.");

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        "Lo siento, hubo un error al procesar tu solicitud. Por favor intenta nuevamente más tarde.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const suggestions = [
        { label: "Crear imagen", icon: "🎨" },
        { label: "Crear un video", icon: "🎥" }, // Video creation
        { label: "Escribir cualquier cosa", icon: "✍️" },
        { label: "Ayúdame a aprender", icon: "🎓" },
        { label: "Dale un impulso a mi día", icon: "🚀" },
    ];

    const ChatInput = ({ centered = false }) => (
        <div className={cn(
            "relative flex flex-col w-full overflow-hidden rounded-[2rem] border bg-muted/40 transition-all hover:bg-muted/60 focus-within:ring-1 focus-within:ring-ring/50 focus-within:bg-muted/60",
            centered ? "shadow-lg" : "shadow-sm"
        )}>
            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className="flex gap-2 p-3 pb-0 px-4 overflow-x-auto">
                    {attachments.map((file, i) => (
                        <div key={i} className="relative group shrink-0">
                            <div className="h-16 w-16 rounded-lg border bg-background flex items-center justify-center overflow-hidden">
                                {file.type.startsWith('image/') ? (
                                    <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                                ) : (
                                    <Paperclip className="h-6 w-6 text-muted-foreground" />
                                )}
                            </div>
                            <button
                                onClick={() => removeAttachment(i)}
                                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={centered ? "Pregunta a Gemini" : "Escribe un mensaje..."}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-6 py-4 text-lg placeholder:text-muted-foreground/50 h-auto min-h-[60px]"
                disabled={isLoading || isUploading}
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                    }
                }}
            />

            <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                    />
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="rounded-full h-9 px-3 text-muted-foreground hover:bg-background/50 hover:text-foreground transition-colors gap-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                        <span className="text-xs font-medium">Adjuntar</span>
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="w-auto h-9 gap-2 border-0 bg-transparent shadow-none focus:ring-0 font-medium hover:bg-muted/50 rounded-full px-3 text-muted-foreground hover:text-foreground transition-colors text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                            <SelectItem value="gemini-1.0-pro">Gemini 1.0 Pro</SelectItem>
                            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                            <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        disabled={(!input.trim() && attachments.length === 0) || isLoading || isUploading}
                        onClick={handleSubmit}
                        className={cn(
                            "h-9 w-9 rounded-full transition-all hover:bg-background/50",
                            (input.trim() || attachments.length > 0) ? "opacity-100 text-primary" : "opacity-0"
                        )}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
                {/* Mic button could go here */}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] md:h-[calc(100vh-theme(spacing.4))] max-w-4xl mx-auto w-full bg-background relative">

            {messages.length === 0 ? (
                // Initial "Gemini-like" State
                <div className="flex-1 flex flex-col justify-center p-4 animate-in fade-in duration-500 w-full max-w-3xl mx-auto">
                    <div className="mb-10 space-y-2">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src="/images/profile.png" />
                                <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                            </Avatar>
                            <h1 className="text-2xl font-medium tracking-tight">
                                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-red-500 bg-clip-text text-transparent">
                                    Hola, Ronald
                                </span>
                            </h1>
                        </div>
                        <p className="text-3xl md:text-4xl font-medium">
                            ¿Por dónde empezamos?
                        </p>
                    </div>

                    <div className="w-full space-y-8">


                        <ChatInput centered={true} />

                        <div className="flex flex-wrap justify-center gap-3">
                            {suggestions.map((s) => (
                                <button
                                    key={s.label}
                                    onClick={() => handleSubmit(null, s.label)}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary/50 hover:bg-secondary transition-colors text-sm font-medium whitespace-nowrap"
                                >
                                    <span>{s.icon}</span>
                                    <span>{s.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                // Chat Interface State
                <>
                    <header className="flex items-center justify-between px-6 py-6 border-b bg-background/95 backdrop-blur z-20">
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-semibold leading-none tracking-tight">EliteSeller AI</h1>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNewChat}
                            className="rounded-full h-8 w-8 text-muted-foreground hover:bg-background/50 hover:text-foreground transition-colors"
                            title="Nueva conversación"
                        >
                            <PlusCircle className="h-5 w-5" />
                        </Button>
                    </header>

                    <div className="flex-1 relative overflow-hidden">
                        <ScrollArea className="h-full px-4 pt-4" ref={scrollAreaRef}>
                            <div className="flex flex-col gap-6 min-h-full pb-8">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "flex w-full items-start gap-3 max-w-[85%]",
                                            message.role === "user"
                                                ? "ml-auto flex-row-reverse"
                                                : "mr-auto"
                                        )}
                                    >
                                        <Avatar
                                            className={cn(
                                                "size-8 shrink-0",
                                                message.role === "user" ? "hidden" : "block"
                                            )}
                                        >
                                            <AvatarImage src="/images/profile.png" />
                                            <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                                        </Avatar>

                                        <div className="flex flex-col gap-2">
                                            {/* Attachments Display */}
                                            {message.attachments && message.attachments.length > 0 && (
                                                <div className={cn("flex flex-wrap gap-2", message.role === "user" && "justify-end")}>
                                                    {message.attachments.map((file, i) => (
                                                        <div key={i} className="relative overflow-hidden rounded-lg border bg-muted/50 w-32 h-32">
                                                            {file.type.startsWith('image/') ? (
                                                                <img src={file.url} alt="Attachment" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center">
                                                                    <Paperclip className="h-8 w-8 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}



                                            {message.content && (
                                                <div
                                                    className={cn(
                                                        "rounded-2xl px-5 py-3 text-sm shadow-sm leading-relaxed",
                                                        message.role === "user"
                                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                            : "bg-muted text-foreground rounded-tl-sm border"
                                                    )}
                                                >
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 last:mb-0" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 last:mb-0" {...props} />,
                                                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                            a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-primary/80" {...props} />,
                                                            code: ({ node, inline, className, children, ...props }) => {
                                                                return inline ? (
                                                                    <code className="bg-muted-foreground/20 px-1 py-0.5 rounded font-mono text-xs" {...props}>
                                                                        {children}
                                                                    </code>
                                                                ) : (
                                                                    <pre className="bg-muted-foreground/10 p-2 rounded-lg overflow-x-auto my-2 font-mono text-xs">
                                                                        <code className={className} {...props}>
                                                                            {children}
                                                                        </code>
                                                                    </pre>
                                                                )
                                                            }
                                                        }}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && messages[messages.length - 1]?.role === "user" && (
                                    <div className="flex w-full items-start gap-3 max-w-[85%] mr-auto">
                                        <Avatar className="size-8 shrink-0">
                                            <AvatarImage src="/images/profile.png" />
                                            <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                                        </Avatar>
                                        <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm border flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            <span className="text-muted-foreground">Pensando...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={bottomRef} />
                            </div>
                        </ScrollArea>
                        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                    </div>

                    {/* Input Area (Bottom) */}
                    <div className="px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="w-full max-w-4xl mx-auto">
                            <ChatInput />
                        </div>
                        <div className="text-center text-[10px] text-muted-foreground mt-2">
                            La IA puede cometer errores. Considera verificar la información
                            importante.
                        </div>
                    </div>
                </>
            )
            }
        </div >
    );
}
