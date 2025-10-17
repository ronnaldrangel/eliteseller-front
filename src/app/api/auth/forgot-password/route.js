import { NextResponse } from 'next/server'
import { strapiAuth } from '@/lib/strapi'

export async function POST(request) {
  try {
    const { email } = await request.json()

    // Validación de parámetros
    if (!email) {
      return NextResponse.json({ 
        error: 'El email es requerido',
        details: {
          email: 'El email es requerido'
        }
      }, { status: 400 })
    }

    console.log('🔑 Password reset request for:', email)

    const strapiResponse = await strapiAuth.forgotPassword(email)
    const strapiData = await strapiResponse.json()

    if (strapiResponse.ok) {
      // Siempre devolver mensaje de éxito por razones de seguridad
      // (no revelar si el email existe o no)
      return NextResponse.json({
        message: "Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña."
      })
    } else {
      console.error('❌ Strapi forgot password error:', strapiData)
      
      // Por seguridad, devolver mensaje genérico en lugar del error específico
      // para no revelar información sobre la existencia de cuentas
      return NextResponse.json({
        error: "Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo."
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Error in forgot-password:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}