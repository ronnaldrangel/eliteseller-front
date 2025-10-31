"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import md5 from "blueimp-md5"
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  CameraIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
  Command,
  BoxIcon,
  ChartBarIcon,
  BotIcon,
  MenuSquareIcon,
  MessageSquareIcon,
  ChevronRight,
  PlugIcon
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Image from "next/image"
import { TeamSwitcher } from "@/components/team-switcher"
import { useChatbot } from "@/contexts/chatbot-context"
import { SidebarOptInForm } from "@/components/sidebar-optin-form"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/home",
      icon: () => (
        <Image
          src="/icons/dashboard.webp"
          alt="Dashboard"
          width={16}
          height={16}
          className="size-4 rounded-sm object-cover"
        />
      ),
    },
    {
      title: "Chats (CRM)",
      url: "/chats",
      icon: () => (
        <Image
          src="/icons/chats.png"
          alt="Chats"
          width={16}
          height={16}
          className="size-4 rounded-sm object-cover"
        />
      ),
    },
    {
      title: "Etiquetas",
      url: "/tags",
      icon: () => (
        <Image
          src="/icons/tags.webp"
          alt="Etiquetas"
          width={16}
          height={16}
          className="size-4 rounded-sm object-cover"
        />
      ),
    },
    {
      title: "Disparadores",
      url: "/triggers",
      icon: () => (
        <Image
          src="/icons/triggers.webp"
          alt="Disparadores"
          width={16}
          height={16}
          className="size-4 rounded-sm object-cover"
        />
      ),
    },
    {
      title: "Productos",
      url: "/products",
      icon: () => (
        <Image
          src="/icons/productos.webp"
          alt="Productos"
          width={16}
          height={16}
          className="size-4 rounded-sm object-cover"
        />
      ),
    },
    {
      title: "Ventas",
      url: "/sales",
      icon: () => (
        <Image
          src="/icons/sales.png"
          alt="Ventas"
          width={16}
          height={16}
          className="size-4 rounded-sm object-cover"
        />
      ),
    },
    // {
    //   title: "Metricas",
    //   url: "/metrics",
    //   icon: ChartBarIcon,
    // },
    {
      title: "Asistente AI",
      url: "/assistant",
      icon: () => (
        <Image
          src="/icons/vendedor.png"
          alt="Asistente AI"
          width={16}
          height={16}
          className="size-4 rounded-sm object-cover"
        />
      ),
    },
    {
      title: "Integraciones",
      url: "#",
      icon: () => (
        <Image
          src="/icons/integraciones.png"
          alt="Integraciones"
          width={16}
          height={16}
          className="size-4 rounded-sm object-cover"
        />
      ),
      items: [
        { title: "WhatsApp", url: "/integrations/whatsapp" },
        { title: "Shopify", url: "/integrations/shopify" },
        { title: "n8n", url: "/integrations/n8n" },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Ayuda",
      url: "/help",
      icon: () => (
        <Image
          src="/icons/ayuda.png"
          alt="Ayuda"
          width={16}
          height={16}
          className="size-4 rounded-sm object-cover"
        />
      ),
    },
    {
      title: "Afiliados",
      url: "/affiliates",
      icon: () => (
        <Image
          src="/icons/afiliados.png"
          alt="Afiliados"
          width={16}
          height={16}
          className="size-4 rounded-sm object-cover"
        />
      ),
    },
  ],
}

export function AppSidebar({
  chatbotSlug,
  ...props
}) {
  const { data: session } = useSession()
  // const { selectedChatbotId } = useChatbot()
  const slug = chatbotSlug || null

  // const cid = selectedChatbotId ? encodeURIComponent(String(selectedChatbotId)) : null
  const withChatbotSegment = (path) => {
    if (!slug) return "/select" // ← Usa slug en lugar de cid
    const trimmed = path.startsWith('/') ? path : `/${path}`
    if (trimmed === '/dashboard') return `/dashboard/${slug}`
    return `/dashboard/${slug}${trimmed}`
  }
  const navMainDynamic = data.navMain.map((item) => {
    const dynamicPaths = ["/dashboard", "/home", "/chats", "/tags", "/triggers", "/products", "/sales", "/assistant", "/integrations"]
    if (item.items && item.items.length > 0) {
      // Map sub-items (e.g., Integrations) to dynamic URLs
      const mappedSubItems = item.items.map((sub) => ({
        ...sub,
        url: withChatbotSegment(sub.url)
      }))
      const baseUrl = item.url && item.url !== "#" ? withChatbotSegment(item.url) : withChatbotSegment("/integrations")
      return { ...item, url: baseUrl, items: mappedSubItems }
    } else if (dynamicPaths.includes(item.url)) {
      return { ...item, url: withChatbotSegment(item.url) }
    }
    return item
  })

  const navSecondaryDynamic = data.navSecondary.map((item) => {
    const dynamicSecondary = ["/help", "/docs", "/affiliates"]
    if (dynamicSecondary.includes(item.url)) {
      return { ...item, url: withChatbotSegment(item.url) }
    }
    return item
  })

  const userFromSession = {
    name: session?.user?.name || session?.user?.email || "Usuario",
    email: session?.user?.email || "",
    avatar: `https://www.gravatar.com/avatar/${md5((session?.user?.email || "").trim().toLowerCase())}?d=retro`,
  }
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <div className="flex pb-2">
          <Image
            src="/images/logo-black.png"
            alt="Logo"
            width={140}
            height={24}
            priority
            className="h-8 w-auto dark:hidden"
          />
          <Image
            src="/images/logo-white.png"
            alt="Logo"
            width={140}
            height={24}
            priority
            className="h-8 w-auto hidden dark:block"
          />
        </div>
        <div className="pt-1">
          <TeamSwitcher chatbotSlug={chatbotSlug} />
        </div>
      </SidebarHeader>
      {/* <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <a href="#">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Command className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Run8in</span>
                <span className="truncate text-xs">Power in 1 click</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu> */}
      <SidebarContent>
        <NavMain items={navMainDynamic} />
        <NavSecondary items={navSecondaryDynamic} className="mt-auto" />
        {/* <SidebarOptInForm /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userFromSession} />
      </SidebarFooter>
    </Sidebar>
  );
}
