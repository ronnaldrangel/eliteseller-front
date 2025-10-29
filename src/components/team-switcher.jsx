"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, BotIcon } from "lucide-react"
import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useChatbot } from "@/contexts/chatbot-context"
import { buildStrapiUrl } from "@/lib/strapi"
import useSWR from 'swr'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function TeamSwitcher({ addLabel = "Crear chatbot", onAdd } = {}) {
  const { isMobile } = useSidebar()
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { chatbots, setChatbots, selectedChatbotId, setSelectedChatbotId } = useChatbot()

  const userId = session?.user?.strapiUserId
  const token = session?.strapiToken
  const chatbotsUrl = (token && userId)
    ? buildStrapiUrl(`/api/chatbots?filters[users_permissions_user][id][$eq]=${encodeURIComponent(userId)}`)
    : null

  const { data: chatbotsData, error, isLoading } = useSWR(chatbotsUrl)

  React.useEffect(() => {
    if (!chatbotsData) return
    const items = Array.isArray(chatbotsData) ? chatbotsData : (chatbotsData?.data || [])
    setChatbots(items)
    if (!selectedChatbotId && items.length > 0) {
      const first = items[0]
      const firstDocId = String(first?.documentId ?? first?.id ?? '')
      if (firstDocId) setSelectedChatbotId(firstDocId)
    }
  }, [chatbotsData])

  const teams = chatbots.map((cb) => {
    const routeId = String(cb?.documentId ?? cb?.id ?? '')
    const displayId = String(cb?.id ?? cb?.documentId ?? '')
    const name = cb?.chatbot_name || cb?.name || cb?.title || `Chatbot ${displayId}`
    return {
      id: routeId,
      displayId,
      name,
      logo: BotIcon,
      plan: "Chatbot",
    }
  })

  const activeTeam = (() => {
    const byId = teams.find(t => String(t.id) === String(selectedChatbotId))
    return byId || teams[0]
  })()

  // Inicializa el contexto desde el segmento dinámico si existe
  React.useEffect(() => {
    if (!pathname) return
    const parts = pathname.split('/')
    const idx = parts.indexOf('dashboard')
    const idFromPath = idx !== -1 ? parts[idx + 1] : null
    if (idFromPath && String(idFromPath) !== String(selectedChatbotId)) {
      setSelectedChatbotId(String(idFromPath))
    }
  }, [pathname])

  const handleSelect = (id) => {
    setSelectedChatbotId(id)
    const parts = (pathname || '').split('/')
    const idx = parts.indexOf('dashboard')
    if (idx !== -1) {
      // Reemplaza el segmento del chatbot y navega en la misma ruta
      parts[idx + 1] = String(id)
      const dest = parts.join('/') || `/dashboard/${id}`
      router.replace(dest)
    } else {
      // Si no estamos en /dashboard, lleva a productos por defecto
      router.push(`/dashboard/${id}/home`)
    }
  }

  if (!activeTeam || isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="grid flex-1 gap-1 text-left text-sm leading-tight">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam?.name || "EliteSellers"}</span>
                <span className="truncate text-xs">{`ID: ${activeTeam?.displayId || ''}`}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Chatbots
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={`${team.name}-${team.id ?? index}`}
                onClick={() => handleSelect(String(team.id))}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <team.logo className="size-3.5 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => router.push('/plans')}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">{addLabel}</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}