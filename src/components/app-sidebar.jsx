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
} from "@/components/ui/sidebar"
import Image from "next/image"
import { useTheme } from 'next-themes'

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Productos",
      url: "/products",
      icon: BoxIcon,
    },
    {
      title: "Metricas",
      url: "/metrics",
      icon: ChartBarIcon,
    },
    {
      title: "Mi vendedor",
      url: "/assistant",
      icon: BotIcon,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: CameraIcon,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: FileTextIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: FileCodeIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Ayuda",
      url: "#",
      icon: HelpCircleIcon,
    },
    {
      title: "Documentacion",
      url: "#",
      icon: FileTextIcon,
    },
    {
      title: "Afiliados",
      url: "/afiliados",
      icon: UsersIcon,
    },
  ],
  // Se eliminó la sección de documentos del sidebar
}

export function AppSidebar({
  ...props
}) {
  const { data: session } = useSession()
  const { resolvedTheme } = useTheme()
  const userFromSession = {
    name: session?.user?.name || session?.user?.email || "Usuario",
    email: session?.user?.email || "",
    // Avatar generado con Gravatar estilo retro a partir del email
    avatar: `https://www.gravatar.com/avatar/${md5((session?.user?.email || "").trim().toLowerCase())}?d=retro`,
  }
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
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
        <div className="flex pb-2">
              <Image
              src={resolvedTheme === "dark" ? "/images/logo-white.png" : "/images/logo-black.png"}
              alt="Logo"
              width={140}
              height={24}
              priority
              className="h-8 w-auto"
            />
        </div>

      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userFromSession} />
      </SidebarFooter>
    </Sidebar>
  );
}
