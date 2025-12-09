import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"
import { redirect } from "next/navigation"
import MarketingLayout from "@/components/marketing-layout"
import AnimatedTabsDemo from "@/components/account-animated-tabs"
import crypto from "crypto"

export default async function AccountPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/login?callbackUrl=/account")
  }

  let me = null
  let error = null

  try {
    const res = await fetch(buildStrapiUrl("/api/users/me"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.strapiToken}`,
      },
      cache: "no-store",
    })

    if (!res.ok) {
      const details = await res.json().catch(() => ({}))
      error = details?.error?.message || `No se pudo obtener la informacion de la cuenta (status ${res.status})`
    } else {
      me = await res.json()
    }
  } catch (_) {
    error = "Error al conectar con Strapi. Verifica tu conexion."
  }

  const displayName = me?.name || me?.username || "Usuario"
  const displayEmail = session?.user?.email || me?.email || ""
  const initials = displayName
    ? displayName
        .split(" ")
        .filter(Boolean)
        .map((segment) => segment[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US"
  const providerLabel = me?.provider || "local"
  const gravatarEmail = (session?.user?.email || me?.email || "").trim().toLowerCase()
  const gravatarUrl = gravatarEmail
    ? `https://www.gravatar.com/avatar/${crypto
        .createHash("md5")
        .update(gravatarEmail)
        .digest("hex")}?d=retro`
    : undefined

  return (
    <MarketingLayout>
      <div className="mt-2">
        <h1 className="text-2xl font-semibold">Mi Cuenta</h1>
        <p className="mt-2 text-sm text-muted-foreground">Gestion de perfil y preferencias.</p>
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      </div>

      <div className="mt-6 max-w-2xl">
        <AnimatedTabsDemo
          displayName={displayName}
          displayEmail={displayEmail}
          initials={initials}
          providerLabel={providerLabel}
          gravatarUrl={gravatarUrl}
          initialName={me?.name || me?.username || ""}
          initialPhone={me?.phone || ""}
        />
      </div>
    </MarketingLayout>
  )
}