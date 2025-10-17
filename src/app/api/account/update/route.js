import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { buildStrapiUrl } from '@/lib/strapi'

export async function POST(request) {
  try {
    const session = await auth()
    if (!session || !session.strapiToken || !session.user?.strapiUserId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { name, phone } = await request.json()
    if (typeof name === 'undefined' && typeof phone === 'undefined') {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    const userId = session.user.strapiUserId
    const url = buildStrapiUrl(`/api/users/${userId}`)

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.strapiToken}`,
      },
      body: JSON.stringify({
        ...(typeof name !== 'undefined' ? { name } : {}),
        ...(typeof phone !== 'undefined' ? { phone } : {}),
      }),
      cache: 'no-store',
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json({ error: data?.error?.message || 'Error al actualizar usuario' }, { status: res.status })
    }

    return NextResponse.json({ ok: true, user: data })
  } catch (error) {
    console.error('❌ Error en /api/account/update:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}