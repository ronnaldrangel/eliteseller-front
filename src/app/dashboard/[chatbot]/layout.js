import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"
 

export default  async function ChatbotLayout({ children, params })  {
  const { chatbot: chatbotSlug } = await params

  const session = await auth()
  let config = null
  try {
    if (session?.strapiToken) {
      const qs = new URLSearchParams()
      qs.set("pagination[pageSize]", "1")
      qs.set("sort", "createdAt:desc")
      qs.set("fields[0]", "isActive")
      qs.set("fields[1]", "topbarContent")
      qs.set("populate[logo_dark][fields][0]", "url")
      qs.set("populate[logo_light][fields][0]", "url")
      qs.set("populate[icon_dark][fields][0]", "url")
      qs.set("populate[icon_light][fields][0]", "url")

      const res = await fetch(buildStrapiUrl(`/api/config-apps?${qs.toString()}`), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.strapiToken}`,
        },
        cache: "no-store",
      })
      if (res.ok) {
        const payload = await res.json()
        const first = Array.isArray(payload?.data) && payload.data.length > 0 ? payload.data[0] : null
        if (first) {
          const attrs = first.attributes || first
          config = {
            isActive: !!attrs.isActive,
            topbarContent: Array.isArray(attrs.topbarContent) ? attrs.topbarContent : [],
            logo_dark: attrs.logo_dark?.url || attrs.logo_dark?.data?.attributes?.url || null,
            logo_light: attrs.logo_light?.url || attrs.logo_light?.data?.attributes?.url || null,
            icon_dark: attrs.icon_dark?.url || attrs.icon_dark?.data?.attributes?.url || null,
            icon_light: attrs.icon_light?.url || attrs.icon_light?.data?.attributes?.url || null,
          }
        }
      }
    }
  } catch {}

  const toAbsUrl = (u) => (!u ? null : u.startsWith("http") ? u : buildStrapiUrl(u))

  return (
    <SidebarProvider
      topbarActive={!!config?.isActive}
      topbarItems={Array.isArray(config?.topbarContent) ? config.topbarContent : []}
      topbarIconLight={toAbsUrl(config?.icon_light)}
      topbarIconDark={toAbsUrl(config?.icon_dark)}
      topbarLogoLight={toAbsUrl(config?.logo_light)}
      topbarLogoDark={toAbsUrl(config?.logo_dark)}
    >
      <AppSidebar variant="inset" chatbotSlug={chatbotSlug} />
      <SidebarInset>
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
