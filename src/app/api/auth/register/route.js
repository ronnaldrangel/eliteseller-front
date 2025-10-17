import { NextResponse } from 'next/server'
import { strapiAuth } from '@/lib/strapi'

export async function POST(request) {
  try {
    const { username, email, password, name, phone } = await request.json()

    // Validación de parámetros requeridos
    if (!username || !email || !password) {
      return NextResponse.json({ 
        error: 'Todos los campos son requeridos',
        details: {
          ...((!username) && { username: 'El nombre de usuario es requerido' }),
          ...((!email) && { email: 'El email es requerido' }),
          ...((!password) && { password: 'La contraseña es requerida' })
        }
      }, { status: 400 })
    }

    console.log('📝 Registration attempt for:', email)

    const userData = { username, email, password }
    if (name) userData.name = name
    if (phone) userData.phone = phone

    const strapiResponse = await strapiAuth.register(userData)

    const strapiData = await strapiResponse.json()

    if (!strapiResponse.ok) {
      console.error('❌ Strapi registration error:', strapiData)
      
      // Manejar errores específicos de Strapi
      let errorMessage = 'Error en el registro'
      let details = {}

      if (strapiData.error) {
        if (strapiData.error.message.includes('Email or Username are already taken')) {
          errorMessage = 'El email o nombre de usuario ya están en uso'
          details = {
            email: 'Este email ya está registrado',
            username: 'Este nombre de usuario ya está en uso'
          }
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

    console.log('✅ Usuario registrado exitosamente:', strapiData.user?.username)

    // Retornar datos del usuario (sin el JWT por seguridad)
    return NextResponse.json({
      success: true,
      user: {
        id: strapiData.user.id,
        username: strapiData.user.username,
        email: strapiData.user.email,
        name: strapiData.user?.name,
        phone: strapiData.user?.phone
      }
    })

  } catch (error) {
    console.error('❌ Error in register:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}