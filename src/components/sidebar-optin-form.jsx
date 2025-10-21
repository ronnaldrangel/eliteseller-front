"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SidebarInput } from "@/components/ui/sidebar"
import Link from "next/link"

export function SidebarOptInForm() {
  return (
    <Card className="gap-2 py-4 shadow-none m-2">
      <CardHeader className="px-4">
        <CardTitle className="text-sm">🚀 Mejora tu plan</CardTitle>
        <CardDescription>
          Desbloquee el acceso a todas las funcionalidades de EliteSeller.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4">
          <div className="grid gap-2.5">
            <Link
              href="/plans"
              className="inline-flex items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 w-full shadow-none"
            >
              Mejorar ahora
            </Link>
          </div>
      </CardContent>
    </Card>
  )
}