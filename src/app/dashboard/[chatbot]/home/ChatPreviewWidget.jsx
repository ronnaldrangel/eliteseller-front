"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ChatInterface from "@/components/chat/ChatInterface";

export default function ChatPreviewWidget({ chatbotName = "Chatbot" }) {
  const [open, setOpen] = useState(false);

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
               <ChatInterface 
                    isWidget={true} 
                    onClose={() => setOpen(false)} 
                    chatbotName={chatbotName} 
               />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 text-white shadow-xl shadow-primary/40 transition-shadow duration-300 cursor-pointer hover:shadow-[0_0_0_4px_rgba(255,255,255,0.35),0_20px_35px_-10px_rgba(59,130,246,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
