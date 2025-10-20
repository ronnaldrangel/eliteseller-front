import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function ChatsPage() {
  let loginUrl = null
  let loginError = null
  try {
    const res = await fetch("https://web.wazend.net/platform/api/v1/users/91/login", {
      method: "GET",
      headers: { "api_access_token": "gz3CXVvGvjYrZS2ka5g31cJH" },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      loginError = data?.error?.message || `No se pudo obtener login (status ${res.status})`
    } else {
      loginUrl = data?.url || null
    }
  } catch (e) {
    loginError = "Error de red al conectar con Wazend"
  }

  return (
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-2xl font-semibold">Chats</h1>
                <p className="text-sm text-muted-foreground mt-2">Tus conversaciones y asistentes.</p>
              </div>
              <div className="px-4 lg:px-6">
                {loginError && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm mb-2">
                    {loginError}
                  </div>
                )}
                <div className="rounded-lg border bg-muted/20 overflow-hidden">
                  <iframe
                    title="Wazend"
                    src={loginUrl || "https://web.wazend.net/"}
                    className="w-full h-[600px] border-0"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}