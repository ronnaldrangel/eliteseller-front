import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const chatbot = searchParams.get('chatbot')

    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'
    const queryString = chatbot ? `?chatbot=${encodeURIComponent(chatbot)}` : ''
    const apiUrl = `${strapiUrl}/api/dashboard/stats${queryString}`

    console.log('Fetching from Strapi:', apiUrl)

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('Strapi error:', response.status)
      return NextResponse.json(
        { 
          error: `Strapi error: ${response.status}`,
          data: { stats: {} }
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error en /api/dashboard/stats:', error)
    return NextResponse.json(
      { 
        error: 'Error al obtener estadísticas',
        data: { stats: {} }
      },
      { status: 500 }
    )
  }
}