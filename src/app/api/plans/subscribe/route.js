import { NextResponse } from "next/server"

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
    const res = await fetch("https://n8n.eliteseller.app/webhook/flow/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id, userId }),
      cache: "no-store",
      redirect: "manual",
    })
    const location = res.headers.get("location")
    if (location && redirectFlag) {
      return NextResponse.redirect(location)
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const message = data?.error?.message || `Webhook respondió error (status ${res.status})`
      return NextResponse.json({ error: { message } }, { status: res.status })
    }
    const url = data?.redirectUrl || data?.url || data?.href || null
    if (redirectFlag && typeof url === "string" && url.length > 0) {
      return NextResponse.redirect(url)
    }
    return NextResponse.json({ ok: true, url })
  } catch (e) {
    return NextResponse.json({ error: { message: "Error de red al conectar con webhook" } }, { status: 502 })
  }
}