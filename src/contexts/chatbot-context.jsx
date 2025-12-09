"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

const ChatbotContext = createContext(null)

export function ChatbotProvider({ children }) {
  const [chatbots, setChatbots] = useState([])
  const [selectedChatbot, setSelectedChatbot] = useState(null)

  // Restore selection from storage (includes legacy string format)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("selectedChatbot")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === "object") {
          setSelectedChatbot(parsed)
          return
        }
      }

      const legacy = localStorage.getItem("selectedChatbotId")
      if (legacy) {
        setSelectedChatbot({
          routeSegment: legacy,
        })
      }
    } catch (_) {}
  }, [])

  // Persist selection using the new JSON shape
  useEffect(() => {
    try {
      if (selectedChatbot) {
        localStorage.setItem("selectedChatbot", JSON.stringify(selectedChatbot))
        localStorage.removeItem("selectedChatbotId")
      } else {
        localStorage.removeItem("selectedChatbot")
        localStorage.removeItem("selectedChatbotId")
      }
    } catch (_) {}
  }, [selectedChatbot])

  const value = useMemo(
    () => ({
      chatbots,
      selectedChatbot,
      setChatbots,
      setSelectedChatbot,
    }),
    [chatbots, selectedChatbot]
  )

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>
}

export function useChatbot() {
  const ctx = useContext(ChatbotContext)
  if (!ctx) {
    throw new Error("useChatbot must be used within a ChatbotProvider")
  }
  return ctx
}
