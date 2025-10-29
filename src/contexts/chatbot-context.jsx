"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

const ChatbotContext = createContext(null)

export function ChatbotProvider({ children }) {
  const [chatbots, setChatbots] = useState([])
  const [selectedChatbotId, setSelectedChatbotId] = useState(null)

  // Restaurar selección desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("selectedChatbotId")
      if (saved) setSelectedChatbotId(saved)
    } catch (_) {}
  }, [])

  // Persistir selección
  useEffect(() => {
    try {
      if (selectedChatbotId) {
        localStorage.setItem("selectedChatbotId", selectedChatbotId)
      } else {
        localStorage.removeItem("selectedChatbotId")
      }
    } catch (_) {}
  }, [selectedChatbotId])

  const value = useMemo(() => ({
    chatbots,
    selectedChatbotId,
    setChatbots,
    setSelectedChatbotId,
  }), [chatbots, selectedChatbotId])

  return (
    <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>
  )
}

export function useChatbot() {
  const ctx = useContext(ChatbotContext)
  if (!ctx) {
    throw new Error("useChatbot must be used within a ChatbotProvider")
  }
  return ctx
}