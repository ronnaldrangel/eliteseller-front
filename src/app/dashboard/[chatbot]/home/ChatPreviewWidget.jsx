"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, SendHorizontal, ChevronDown, X, Sparkles, Paperclip, Send, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// TODO: Replace with your actual n8n webhook URL or use env var if preferred
const WEBHOOK_URL = "https://bot.eliteseller.app/webhook/17250cba-5a2d-4826-a471-0dcf889704d7/chat";

export default function ChatPreviewWidget({ chatbotName = "Chatbot" }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const sessionId = useRef("");

  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [open, messages]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const messageToSend = input.trim();
    if (!messageToSend || isLoading) return;

    setInput("");

    // Add user message
    const newMessages = [
      ...messages,
      {
        id: Date.now().toString(),
        role: "user",
        content: messageToSend,
        time: new Date().toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" })
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
          // Sending chatbotName as model or extra param if needed, 
          // though the original code used 'model'. We'll stick to the payload structure of ChatPage 
          // but maybe add chatbotName for context if the webhook supports it.
          // For now, mirroring ChatPage exactly to ensure "functionality" is reused.
          model: "gemini-1.5-pro", 
          history: newMessages.map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
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
                    ...updated[updated.length - 1],
                    content: currentText,
                  };
                  return updated;
                } else {
                  // Append new assistant message
                  return [
                    ...prev,
                    { 
                      id: Date.now().toString() + "-bot",
                      role: "assistant", 
                      content: currentText,
                      time: new Date().toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" })
                    },
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
      toast.error("Error al conectar con el agente.");
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "-error",
          role: "assistant",
          content: "Lo siento, hubo un error al procesar tu solicitud. Por favor intenta nuevamente más tarde.",
          time: new Date().toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" })
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
              className="fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l bg-background shadow-2xl md:w-1/2 lg:w-1/4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold">{chatbotName}</span>
                    <span className="text-xs text-muted-foreground">En línea</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                  aria-label="Cerrar chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto bg-muted/30 px-4 py-4" ref={scrollRef}>
                 {messages.length === 0 && (
                   <div className="flex h-full flex-col items-center justify-center space-y-4 text-center text-muted-foreground opacity-50">
                     <Sparkles className="h-12 w-12" />
                     <p className="text-sm">Inicia una conversación con {chatbotName}</p>
                   </div>
                 )}
                 <div className="space-y-6 pb-4">
                    {messages.map((message) => {
                      const isUser = message.role === "user";
                      return (
                        <div key={message.id} className={cn(
                          "flex w-full items-start gap-3",
                          isUser ? "flex-row-reverse" : ""
                        )}>
                          <Avatar className={cn("h-8 w-8 shrink-0", isUser ? "hidden" : "block")}>
                            <AvatarImage src="/images/profile.png" />
                            <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                          </Avatar>

                          <div className={cn(
                            "flex max-w-[85%] flex-col gap-1 rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                            isUser
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-background text-foreground rounded-tl-sm border"
                          )}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                                    a: ({node, ...props}) => <a target="_blank" rel="noopener noreferrer" className="underline font-medium" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                                    li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
                                    code: ({node, inline, className, children, ...props}) => {
                                        return inline ? 
                                            <code className="bg-muted/50 rounded px-1 py-0.5 font-mono text-xs" {...props}>{children}</code> :
                                            <pre className="bg-muted/50 rounded p-2 overflow-x-auto my-2 font-mono text-xs" {...props}><code>{children}</code></pre>
                                    }
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                            <span className={cn("text-[10px] self-end opacity-70", isUser ? "text-primary-foreground" : "text-muted-foreground")}>
                              {message.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {isLoading && (
                        <div className="flex w-full items-start gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src="/images/profile.png" />
                            </Avatar>
                            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border bg-background px-4 py-3 shadow-sm">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Escribiendo...</span>
                            </div>
                        </div>
                    )}
                 </div>
              </div>

              {/* Input Area */}
              <form onSubmit={handleSubmit} className="border-t p-4 bg-background">
                <div className="flex items-center gap-2 rounded-[1.5rem] border bg-muted/40 px-2 py-1 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                  <Input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 border-0 bg-transparent px-3 py-2 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className={cn(
                        "h-9 w-9 rounded-full transition-all",
                        input.trim() ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" : "bg-transparent text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 text-white shadow-xl shadow-primary/40"
          style={{
            background: "linear-gradient(120deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)",
            backgroundSize: "300% 300%",
          }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Abrir chat"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:animate-[shimmer_1.5s_infinite]" />
          
          <Sparkles className="relative h-6 w-6" />
        </motion.button>
      )}
    </>
  );
}
