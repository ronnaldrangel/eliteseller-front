import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const plan_id = searchParams.get("plan_id")
  const userId = searchParams.get("userId")
  const redirectFlag = searchParams.get("redirect")

  if (!plan_id || !userId) {
    return NextResponse.json({ error: { message: "plan_id y userId son requeridos" } }, { status: 400 })
  }

  try {
    const cookieStore = cookies()
    const affiliateRef = cookieStore.get("affiliate-ref-id")?.value || null
    const payload = { plan_id, userId }
    if (affiliateRef) payload.affiliate_ref_id = affiliateRef
    const res = await fetch("https://n8n.eliteseller.app/webhook/flow/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      redirect: "manual",
    })
    const location = res.headers.get("location")
    if (location && redirectFlag) {
      return NextResponse.redirect(location)
    }
    const contentType = res.headers.get("content-type") || ""
    let data = null
    let textBody = null
    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => ({}))
    } else {
      textBody = await res.text().catch(() => null)
    }
    if (!res.ok) {
      if (textBody) {
        return new NextResponse(textBody, { status: res.status, headers: { "Content-Type": "text/plain" } })
      }
      const message = data?.error?.message || `Webhook respondió error (status ${res.status})`
      return NextResponse.json({ error: { message } }, { status: res.status })
    }
    let url = (data?.redirectUrl || data?.url || data?.href || null)
    if (typeof url === "string" && url.startsWith("vhttp")) {
      url = url.slice(1)
    }
    if (redirectFlag && typeof url === "string" && url.length > 0) {
      return NextResponse.redirect(url)
    }
    if (textBody) {
      return new NextResponse(textBody, { status: 200, headers: { "Content-Type": "text/plain" } })
    }
    return NextResponse.json({ ok: true, url })
  } catch (e) {
    return NextResponse.json({ error: { message: "Error de red al conectar con webhook" } }, { status: 502 })
  }
}
