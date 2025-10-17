import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { buildStrapiUrl } from '@/lib/strapi'

export async function POST(request) {
  try {
    const session = await auth()
    if (!session || !session.strapiToken) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { currentPassword, password, passwordConfirmation } = await request.json()
    if (!currentPassword || !password || !passwordConfirmation) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    const url = buildStrapiUrl('/api/auth/change-password')
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.strapiToken}`,
      },
      body: JSON.stringify({ currentPassword, password, passwordConfirmation }),
      cache: 'no-store',
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json({ error: data?.error?.message || 'Error al cambiar contraseña' }, { status: res.status })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Error en /api/account/change-password:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}