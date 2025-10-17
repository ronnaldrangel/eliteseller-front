import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function AffiliatesPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-2xl font-semibold">Afiliados</h1>
                <p className="text-sm text-muted-foreground mt-2">Programa de afiliados y recompensas.</p>
              </div>
            </div>

            <div className="px-4 lg:px-6">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Información e inscripción próximamente.</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}