import { NextResponse } from 'next/server'
import { strapiAuth } from '@/lib/strapi'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ 
        error: 'El email es requerido',
        details: { email: 'El email es requerido' }
      }, { status: 400 })
    }

    console.log('✉️  Resend email confirmation for:', email)

    const strapiResponse = await strapiAuth.sendEmailConfirmation(email)
    const strapiData = await strapiResponse.json().catch(() => ({}))

    if (strapiResponse.ok) {
      return NextResponse.json({
        message: 'Si el correo existe, se ha reenviado el email de verificación.'
      })
    } else {
      console.error('❌ Strapi send email confirmation error:', strapiData)
      // Por seguridad, devolver mensaje genérico y no revelar existencia de cuentas
      return NextResponse.json({
        error: 'Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo.'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Error in send-email-confirmation:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}