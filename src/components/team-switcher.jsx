"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, BotIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr";

import { useChatbot } from "@/contexts/chatbot-context";
import { buildStrapiUrl } from "@/lib/strapi";
import {
  buildChatbotIdentifiers,
  matchesChatbotRouteSegment,
} from "@/lib/utils/chatbot-route";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function TeamSwitcher({
  addLabel = "Crear chatbot",
  onAdd,
  chatbotSlug,
} = {}) {
  const { isMobile } = useSidebar();
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { chatbots, setChatbots, selectedChatbot, setSelectedChatbot } =
    useChatbot();

  const userId = session?.user?.strapiUserId;
  const token = session?.strapiToken;
  const chatbotsUrl =
    token && userId
      ? buildStrapiUrl(
        `/api/chatbots?filters[users_permissions_user][id][$eq]=${encodeURIComponent(
          userId
        )}`
      )
      : null;

  const { data: chatbotsData, isLoading } = useSWR(chatbotsUrl);

  const decorateChatbots = React.useCallback(
    (items) =>
      items.map((item) => ({
        ...item,
        __meta: buildChatbotIdentifiers(item, userId),
      })),
    [userId]
  );

  React.useEffect(() => {
    if (!chatbotsData) return;

    const items = Array.isArray(chatbotsData)
      ? chatbotsData
      : chatbotsData?.data || [];
    const decorated = decorateChatbots(items);
    setChatbots(decorated);

    const ensureSelectionFromEntry = (entry) => {
      if (!entry?.__meta) return;
      const meta = entry.__meta;
      if (selectedChatbot?.routeSegment === meta.routeSegment) return;
      setSelectedChatbot({
        documentId: meta.documentId,
        slug: meta.slug,
        routeSegment: meta.routeSegment,
        name: meta.name,
      });
    };

    if (chatbotSlug) {
      const match = decorated.find((cb) =>
        matchesChatbotRouteSegment(chatbotSlug, cb, userId)
      );
      if (match) {
        ensureSelectionFromEntry(match);
        return;
      }
    }

    if (!selectedChatbot?.routeSegment && decorated.length > 0) {
      ensureSelectionFromEntry(decorated[0]);
    }
  }, [chatbotsData, chatbotSlug, decorateChatbots, selectedChatbot, setChatbots, setSelectedChatbot, userId]);

  const teams = React.useMemo(() => {
    return chatbots.map((cb) => {
      const meta = cb.__meta ?? buildChatbotIdentifiers(cb, userId);
      return {
        id: meta.documentId,
        displayId: meta.id,
        name: meta.name,
        slug: meta.routeSegment,
        routeSegment: meta.routeSegment,
        actualSlug: meta.slug,
        logo: BotIcon,
        plan: "Chatbot",
      };
    });
  }, [chatbots, userId]);

  const activeTeam = React.useMemo(() => {
    if (chatbotSlug) {
      const bySlug = teams.find((t) => t.routeSegment === chatbotSlug);
      if (bySlug) return bySlug;
    }

    if (selectedChatbot?.routeSegment) {
      const bySelected = teams.find(
        (t) => t.routeSegment === selectedChatbot.routeSegment
      );
      if (bySelected) return bySelected;
    }

    return teams[0];
  }, [teams, chatbotSlug, selectedChatbot?.routeSegment]);

  // Si el slug de la URL no pertenece al usuario redirigimos a la selección.
  React.useEffect(() => {
    if (!chatbotSlug || isLoading) return;
    if (!teams || teams.length === 0) return;
    const isValid = teams.some((team) => team.routeSegment === chatbotSlug);
    if (!isValid) {
      router.replace("/select");
    }
  }, [chatbotSlug, isLoading, teams, router]);

  // Mantener el contexto sincronizado con la URL activa
  React.useEffect(() => {
    if (!pathname || !chatbotSlug || !activeTeam) return;
    if (activeTeam.routeSegment !== chatbotSlug) return;

    if (selectedChatbot?.routeSegment !== activeTeam.routeSegment) {
      setSelectedChatbot({
        documentId: activeTeam.id,
        slug: activeTeam.actualSlug,
        routeSegment: activeTeam.routeSegment,
        name: activeTeam.name,
      });
    }
  }, [
    pathname,
    chatbotSlug,
    activeTeam,
    selectedChatbot?.routeSegment,
    setSelectedChatbot,
  ]);

  const handleSelect = (team) => {
    if (!team) return;

    setSelectedChatbot({
      documentId: team.id,
      slug: team.actualSlug,
      routeSegment: team.routeSegment,
      name: team.name,
    });

    const parts = (pathname || "").split("/");
    const idx = parts.indexOf("dashboard");
    if (idx !== -1 && idx + 1 < parts.length) {
      parts[idx + 1] = team.routeSegment;
      const dest = parts.join("/") || `/dashboard/${team.routeSegment}`;
      if (pathname !== dest) router.replace(dest);
    } else {
      router.push(`/dashboard/${team.routeSegment}/home`);
    }
  };

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
    );
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
                <span className="truncate font-medium">
                  {activeTeam?.name || "EliteSeller"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
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
                key={`${team.routeSegment}-${team.id ?? index}`}
                onClick={() => handleSelect(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <team.logo className="size-3.5 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>Ctrl+{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => {
                if (typeof onAdd === "function") {
                  onAdd();
                } else {
                  router.push("/select");
                }
              }}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Ver chatbots</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
