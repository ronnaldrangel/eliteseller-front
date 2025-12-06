import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/lib/auth"


export default async function ChatbotLayout({ children, params }) {
  const { chatbot: chatbotSlug } = await params

  const session = await auth()

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" chatbotSlug={chatbotSlug} />
      <SidebarInset>
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
