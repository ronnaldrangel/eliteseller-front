import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/lib/auth"
import ChatPreviewWidget from "./home/ChatPreviewWidget"


import { OnboardingPopup } from "@/components/dashboard/OnboardingPopup";

export default async function ChatbotLayout({ children, params }) {
  const { chatbot: chatbotSlug } = await params

  const session = await auth()

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" chatbotSlug={chatbotSlug} />
      <SidebarInset>
        <SiteHeader />
        {children}
        <ChatPreviewWidget chatbotName={chatbotSlug || "Chatbot"} chatbotSlug={chatbotSlug} />
        <OnboardingPopup chatbotSlug={chatbotSlug} />
      </SidebarInset>
    </SidebarProvider>
  )
}
