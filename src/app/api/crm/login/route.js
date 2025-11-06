import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { buildStrapiUrl } from "@/lib/strapi"

export const dynamic = "force-dynamic"

export async function GET(request) {
  const session = await auth()
  const userMeUrl = buildStrapiUrl('/api/users/me')

  let userId
  try {
    const resChan = await fetch(userMeUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.strapiToken ? { 'Authorization': `Bearer ${session.strapiToken}` } : {}),
      },
      cache: 'no-store',
    })
    const dataChan = await resChan.json().catch(() => ({}))
    if (!resChan.ok) {
      return NextResponse.json({
        error: dataChan?.error?.message || `No se pudo cargar user/me (status ${resChan.status})`
      }, { status: resChan.status })
    }
    const accountIdCrm = Array.isArray(dataChan?.data) && dataChan.data.length
      ? dataChan.data[0]?.crm_id
      : (dataChan?.crm_id ?? null)

    userId = typeof accountIdCrm === 'number' ? accountIdCrm : Number(accountIdCrm)
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json({ error: 'No se encontró un crm_id válido en user/me.' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: 'Error al conectar con Strapi para user/me.' }, { status: 500 })
  }

  try {
    const apiToken = process.env.CRM_API_TOKEN ?? 'ZseUZfnHyMzwFWGbHjgnsvSh'
    const res = await fetch(`https://crm.eliteseller.app/platform/api/v1/users/${userId}/login`, {
      method: 'GET',
      headers: { 'api_access_token': apiToken },
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = data?.error?.message || `No se pudo obtener login (status ${res.status})`
      return NextResponse.json({ error: msg }, { status: res.status })
    }
    const url = data?.url || 'https://crm.eliteseller.app/'
    const redirect = request?.nextUrl?.searchParams?.get('redirect')
    if (redirect) {
      return NextResponse.redirect(url)
    }
    return NextResponse.json({ url })
  } catch (e) {
    return NextResponse.json({ error: 'Error de red al conectar con CRM.' }, { status: 502 })
  }
}