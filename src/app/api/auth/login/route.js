import { NextResponse } from 'next/server'
import { strapiAuth } from '@/lib/strapi'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ 
        error: { message: 'El email y la contraseña son requeridos' }
      }, { status: 400 })
    }

    const strapiResponse = await strapiAuth.login({
      identifier: email,
      password,
    })

    const data = await strapiResponse.json().catch(() => ({}))

    if (strapiResponse.ok && data.user) {
      return NextResponse.json({ ok: true })
    }

    // Mapear mensajes comunes a español si vienen en inglés
    let message = data?.error?.message || 'Error al iniciar sesión. Inténtalo de nuevo.'
    if (message === 'Invalid identifier or password') {
      message = 'Email o contraseña incorrectos'
    } else if (message === 'Your account email is not confirmed') {
      message = 'Tu cuenta no está confirmada. Revisa tu correo para confirmar tu email.'
    }

    return NextResponse.json({ error: { message } }, { status: strapiResponse.status || 400 })
  } catch (error) {
    console.error('❌ Error in /api/auth/login:', error)
    return NextResponse.json({ 
      error: { message: 'Error interno del servidor' }
    }, { status: 500 })
  }
}