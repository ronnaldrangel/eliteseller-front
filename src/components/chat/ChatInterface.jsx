"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useState, useRef, useEffect } from "react";
import { Loader2, Paperclip, X, PlusCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChatInput from "./ChatInput";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// TODO: Replace with your actual n8n webhook URL
const WEBHOOK_URL = "https://bot.eliteseller.app/webhook/17250cba-5a2d-4826-a471-0dcf889704d7/chat";



export default function ChatInterface({ 
    isWidget = false, 
    onClose, 
    chatbotName = "EliteSeller AI",
    userName = "Ronald" // In a real app this would come from auth context
}) {
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

    return (
        <div className={cn(
            "flex flex-col w-full bg-background relative",
            isWidget ? "h-full" : "h-[calc(100vh-theme(spacing.16))] md:h-[calc(100vh-theme(spacing.4))] max-w-4xl mx-auto"
        )}>

            {messages.length === 0 ? (
                // Initial "Gemini-like" State
                <div className={cn(
                    "flex-1 flex flex-col justify-center p-4 animate-in fade-in duration-500 w-full mx-auto",
                    isWidget ? "" : "max-w-3xl"
                )}>
                    {isWidget && (
                         <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-4 border-b">
                            {/* <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col leading-tight">
                                    <span className="text-sm font-semibold">{chatbotName}</span>
                                    <span className="text-xs text-muted-foreground">En línea</span>
                                </div>
                            </div> */}
                            {onClose && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                                    aria-label="Cerrar chat"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                         </div>
                    )}

                    <div className={cn("space-y-2", isWidget ? "mt-12 mb-6" : "mb-10")}>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src="/images/profile.png" />
                                <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                            </Avatar>
                            <h1 className={cn("font-medium tracking-tight", isWidget ? "text-xl" : "text-2xl")}>
                                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-red-500 bg-clip-text text-transparent">
                                    Hola, {userName}
                                </span>
                            </h1>
                        </div>
                        <p className={cn("font-medium", isWidget ? "text-2xl" : "text-3xl md:text-4xl")}>
                            ¿Por dónde empezamos?
                        </p>
                    </div>

                    <div className="w-full space-y-8">
                        <ChatInput 
                            centered={true}
                            input={input}
                            setInput={setInput}
                            isLoading={isLoading}
                            isUploading={isUploading}
                            handleSubmit={handleSubmit}
                            attachments={attachments}
                            removeAttachment={removeAttachment}
                            fileInputRef={fileInputRef}
                            handleFileSelect={handleFileSelect}
                            selectedModel={selectedModel}
                            setSelectedModel={setSelectedModel}
                            isWidget={isWidget}
                        />

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
                    <header className={cn(
                        "flex items-center justify-between px-6 py-6 border-b bg-background/95 backdrop-blur z-20",
                        isWidget ? "py-4 px-4" : ""
                    )}>
                        <div className="flex items-center gap-3">
                            
                            <h1 className="text-lg font-semibold leading-none tracking-tight">{chatbotName}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleNewChat}
                                className="rounded-full h-8 w-8 text-muted-foreground hover:bg-background/50 hover:text-foreground transition-colors"
                                title="Nueva conversación"
                            >
                                <PlusCircle className="h-5 w-5" />
                            </Button>
                            {isWidget && onClose && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-full h-8 w-8 flex items-center justify-center text-muted-foreground hover:bg-muted"
                                    aria-label="Cerrar chat"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
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
                        <div className={cn("w-full mx-auto", isWidget ? "" : "max-w-4xl")}>
                            <ChatInput 
                                input={input}
                                setInput={setInput}
                                isLoading={isLoading}
                                isUploading={isUploading}
                                handleSubmit={handleSubmit}
                                attachments={attachments}
                                removeAttachment={removeAttachment}
                                fileInputRef={fileInputRef}
                                handleFileSelect={handleFileSelect}
                                selectedModel={selectedModel}
                                setSelectedModel={setSelectedModel}
                                isWidget={isWidget}
                            />
                        </div>
                        <div className="text-center text-[10px] text-muted-foreground mt-2">
                            La IA puede cometer errores. Considera verificar la información
                            importante.
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
