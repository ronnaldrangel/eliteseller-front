import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Bot,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export function Sidebar({ activeView, setActiveView, isCollapsed, setIsCollapsed }) {
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
    { id: "chatbots", label: "Chatbots", icon: Bot },
  ];

  return (
    <div
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-center border-b p-4">
        <h1 className={cn("font-bold text-xl transition-all", isCollapsed ? "scale-0 hidden" : "scale-100")}>
          Admin
        </h1>
        {isCollapsed && <span className="font-bold text-xl">A</span>}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-2 px-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? "secondary" : "ghost"}
              className={cn(
                "justify-start gap-2",
                isCollapsed ? "justify-center px-2" : "px-4"
              )}
              onClick={() => setActiveView(item.id)}
            >
              <item.icon className="h-5 w-5" />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>
      </div>

      <div className="border-t p-2">
         <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
      </div>
    </div>
  );
}
