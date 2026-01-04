"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import md5 from "blueimp-md5";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Bot
} from "lucide-react";
import Image from "next/image";

import { NavUser } from "@/components/nav-user";
import { SuperAdminNav } from "@/components/super-admin/SuperAdminNav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

export function SuperAdminSidebar({ activeView, setActiveView, ...props }) {
  const { data: session } = useSession();

  const navItems = [
    { id: "overview", title: "Overview", icon: LayoutDashboard },
    { id: "users", title: "Users", icon: Users },
    { id: "subscriptions", title: "Subscriptions", icon: CreditCard },
    { id: "chatbots", title: "Chatbots", icon: Bot },
  ];

  const userFromSession = {
    name: session?.user?.name || session?.user?.email || "Super Admin",
    email: session?.user?.email || "",
    avatar: `https://www.gravatar.com/avatar/${md5(
      (session?.user?.email || "").trim().toLowerCase()
    )}?d=retro`,
  };

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
      </SidebarHeader>
      <SidebarContent>
        <SuperAdminNav 
            items={navItems} 
            activeView={activeView} 
            setActiveView={setActiveView} 
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userFromSession} />
      </SidebarFooter>
    </Sidebar>
  );
}
