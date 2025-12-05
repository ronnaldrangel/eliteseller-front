import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"
import { Marquee } from "@/components/ui/marquee"

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
    <SidebarProvider>
      <AppSidebar variant="inset" chatbotSlug={chatbotSlug} />
      <SidebarInset>
        <SiteHeader />
        {config?.isActive ? (
          <div className="border-b bg-muted/40 overflow-x-hidden">
            <div className="flex items-center gap-3 px-4 lg:px-6 h-10">
              <span className="inline-flex items-center gap-2">
                {config.icon_light ? (
                  <img src={toAbsUrl(config.icon_light)} alt="Icon" className="h-5 w-5 dark:hidden" />
                ) : null}
                {config.icon_dark ? (
                  <img src={toAbsUrl(config.icon_dark)} alt="Icon" className="h-5 w-5 hidden dark:block" />
                ) : null}
                {config.logo_light ? (
                  <img src={toAbsUrl(config.logo_light)} alt="Logo" className="h-5 w-auto dark:hidden" />
                ) : null}
                {config.logo_dark ? (
                  <img src={toAbsUrl(config.logo_dark)} alt="Logo" className="h-5 w-auto hidden dark:block" />
                ) : null}
              </span>
              <Marquee pauseOnHover className="flex-1 min-w-0 [--duration:20s] [--gap:1.5rem]">
                {Array.isArray(config.topbarContent) && config.topbarContent.map((t, i) => (
                  <span key={`top-${i}`} className="text-xs text-muted-foreground">
                    {t}
                  </span>
                ))}
              </Marquee>
            </div>
          </div>
        ) : null}
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
