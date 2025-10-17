import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"
import { redirect } from "next/navigation"
import AnimatedTabsDemo from "@/components/account-animated-tabs"
import crypto from "crypto"

export default async function AccountPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/login?callbackUrl=/account')
  }


  let me = null
  let error = null

  try {
    const res = await fetch(buildStrapiUrl('/api/users/me'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.strapiToken}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const details = await res.json().catch(() => ({}))
      error = details?.error?.message || `No se pudo obtener la información de la cuenta (status ${res.status})`
    } else {
      me = await res.json()
    }
  } catch (e) {
    error = 'Error al conectar con Strapi. Verifica tu conexión.'
  }

  const displayName = me?.name || me?.username || 'Usuario'
  const displayEmail = session?.user?.email || me?.email || ''
  const initials = displayName
    ? displayName
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'US'
  const providerLabel = me?.provider || 'local'
  const gravatarEmail = (session?.user?.email || me?.email || '').trim().toLowerCase()
  const gravatarUrl = gravatarEmail
    ? `https://www.gravatar.com/avatar/${crypto
        .createHash('md5')
        .update(gravatarEmail)
        .digest('hex')}?d=retro`
    : undefined

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 ">
              <div className="px-4 lg:px-6">
                <h1 className="text-2xl font-semibold">Mi Cuenta</h1>
                <p className="text-sm text-muted-foreground mt-2">Gestión de perfil y preferencias.</p>
              </div>
            </div>
            <div className="px-4 lg:px-6 max-w-2xl">
              <AnimatedTabsDemo
                displayName={displayName}
                displayEmail={displayEmail}
                initials={initials}
                providerLabel={providerLabel}
                gravatarUrl={gravatarUrl}
                initialName={me?.name || me?.username || ''}
                initialPhone={me?.phone || ''}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}