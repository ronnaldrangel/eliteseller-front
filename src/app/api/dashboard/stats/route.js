import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"

export async function GET(request) {
  const session = await auth()

  if (!session?.strapiToken) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const qs = new URLSearchParams()
  const chatbot = searchParams.get("chatbot")
  if (chatbot) {
    qs.set("chatbot", chatbot)
  }

  const url = buildStrapiUrl(
    `/api/dashboard/stats${qs.toString() ? `?${qs.toString()}` : ""}`
  )

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.strapiToken}`,
    },
    cache: "no-store",
  })

  const payload = await response.json().catch(() => ({}))

  return NextResponse.json(payload, { status: response.status })
}
