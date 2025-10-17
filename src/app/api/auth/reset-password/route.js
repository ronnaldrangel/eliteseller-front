import { NextResponse } from 'next/server'
import { strapiAuth } from '@/lib/strapi'

export async function POST(request) {
  try {
    const { code, password, passwordConfirmation } = await request.json()

    // Validación de parámetros requeridos
    if (!code || !password || !passwordConfirmation) {
      return NextResponse.json({ 
        error: 'El código, contraseña y confirmación de contraseña son requeridos',
        details: {
          ...((!code) && { code: 'El código de verificación es requerido' }),
          ...((!password) && { password: 'La contraseña es requerida' }),
          ...((!passwordConfirmation) && { passwordConfirmation: 'La confirmación de contraseña es requerida' })
        }
      }, { status: 400 })
    }

    // Validación de coincidencia de contraseñas
    if (password !== passwordConfirmation) {
      return NextResponse.json({ 
        error: 'Las contraseñas no coinciden',
        details: {
          passwordConfirmation: 'Las contraseñas no coinciden'
        }
      }, { status: 400 })
    }

    console.log('🔐 Password reset attempt with code')

    const strapiResponse = await strapiAuth.resetPassword({
      code,
      password,
      passwordConfirmation
    })

    const strapiData = await strapiResponse.json()

    if (strapiResponse.ok) {
      return NextResponse.json({
        message: "Contraseña restablecida exitosamente"
      })
    } else {
      console.error('❌ Strapi reset password error:', strapiData)
      
      // Manejar errores específicos de Strapi
      let errorMessage = 'Error al restablecer la contraseña'
      let details = {}

      if (strapiData.error) {
        if (strapiData.error.message.includes('Incorrect code provided')) {
          errorMessage = 'Código de verificación incorrecto o expirado'
          details = { code: 'El código de verificación es incorrecto o ha expirado' }
        } else if (strapiData.error.message.includes('password')) {
          errorMessage = 'La contraseña no cumple con los requisitos'
          details = { password: 'La contraseña debe tener al menos 6 caracteres' }
        } else {
          errorMessage = strapiData.error.message
        }
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details
      }, { status: strapiResponse.status })
    }
  } catch (error) {
    console.error('❌ Error in reset-password:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}