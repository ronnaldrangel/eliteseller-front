import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { buildStrapiUrl } from '@/lib/strapi'

export async function POST(request, { params }) {
  const { action } = params || {}
  if (!['start', 'stop', 'logout', 'restart'].includes(action)) {
    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 })
  }

  const session = await auth()
  if (!session || !session.strapiToken) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let session_name = null
  const contentType = request.headers.get('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}))
      session_name = body?.session_name || null
    } else {
      const form = await request.formData().catch(() => null)
      session_name = form?.get('session_name') || null
    }
  } catch (e) {
    // no-op
  }

  if (!session_name || typeof session_name !== 'string') {
    return NextResponse.json({ error: 'session_name requerido' }, { status: 400 })
  }

  // Buscar canal por session_name en Strapi
  const qs = new URLSearchParams()
  qs.set('filters[session_name][$eq]', session_name)
  const channelUrl = buildStrapiUrl(`/api/channels?${qs.toString()}`)

  let channelData = null
  try {
    const resChan = await fetch(channelUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.strapiToken}`,
      },
      cache: 'no-store',
    })
    const dataChan = await resChan.json().catch(() => ({}))
    if (!resChan.ok) {
      return NextResponse.json({ error: dataChan?.error?.message || 'Error al obtener canal', details: dataChan }, { status: resChan.status })
    }
    channelData = dataChan
  } catch (e) {
    return NextResponse.json({ error: 'Error al conectar con Strapi' }, { status: 500 })
  }

  const first = Array.isArray(channelData?.data) && channelData.data.length
    ? (channelData.data[0]?.attributes || channelData.data[0])
    : null
  const session_url = first?.session_url ? String(first.session_url).trim() : null
  const session_apikey = first?.session_apikey ? String(first.session_apikey).trim() : null
  if (!session_url || !session_apikey) {
    return NextResponse.json({ error: 'Faltan session_url o session_apikey en canal' }, { status: 400 })
  }

  const baseUrl = session_url.endsWith('/') ? session_url.slice(0, -1) : session_url
  const wazendUrl = `${baseUrl}/api/sessions/${encodeURIComponent(session_name)}/${action}`

  try {
    const res = await fetch(wazendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': session_apikey,
      },
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json({ url: wazendUrl, ok: res.ok, status: res.status, data })
  } catch (e) {
    return NextResponse.json({ error: 'Error al conectar con Wazend', details: e?.message || String(e) }, { status: 500 })
  }
}