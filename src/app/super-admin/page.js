"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { OverviewView } from "@/components/super-admin/OverviewView";
import { UsersView } from "@/components/super-admin/UsersView";
import { SubscriptionsView } from "@/components/super-admin/SubscriptionsView";
import { ChatbotsView } from "@/components/super-admin/ChatbotsView";
import { SuperAdminSidebar } from "@/components/super-admin/SuperAdminSidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeView, setActiveView] = useState("overview");

  useEffect(() => {
    if (status === "loading") return;

    // Redirigir a /select si no está autenticado o no es Admin
    if (status === "unauthenticated" || session?.user?.role !== "Admin") {
      router.push("/select");
    }
  }, [session, status, router]);

  if (session?.user?.role !== "Admin") {
    return null;
  }

  return (
    <SidebarProvider>
      <SuperAdminSidebar
        activeView={activeView}
        setActiveView={setActiveView}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4">
          <div className="flex items-center gap-2 font-medium">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="hidden md:inline">Super Admin Dashboard</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeView === "overview" && <OverviewView />}
          {activeView === "users" && <UsersView />}
          {activeView === "subscriptions" && <SubscriptionsView />}
          {activeView === "chatbots" && <ChatbotsView />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
