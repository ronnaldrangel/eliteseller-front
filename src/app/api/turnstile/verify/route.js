import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ success: false, error: "missing-token" }, { status: 400 })
    }

    const secret = process.env.TURNSTILE_SECRET_KEY
    if (!secret) {
      return NextResponse.json({ success: false, error: "missing-secret" }, { status: 500 })
    }

    const ipHeader = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip")
    const remoteip = ipHeader ? ipHeader.split(",")[0].trim() : undefined

    const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    const formData = new URLSearchParams()
    formData.append("secret", secret)
    formData.append("response", token)
    if (remoteip) formData.append("remoteip", remoteip)

    const verifyResp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    })

    const data = await verifyResp.json()
    return NextResponse.json(data, { status: data?.success ? 200 : 400 })
  } catch (err) {
    return NextResponse.json({ success: false, error: "server-error" }, { status: 500 })
  }
}