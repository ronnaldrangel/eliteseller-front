import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import WazendSessionActions from '@/components/wazend-session-actions'
import ConnectNowDialog from '@/components/connect-now-dialog'
import WazendSessionProfile from '@/components/wazend-session-profile'
import WazendSessionMe from '@/components/wazend-session-me'
import WazendProfileOrConnect from '@/components/wazend-profile-or-connect'

export default async function WhatsAppIntegrationPage({ params }) {
  // Fetch Strapi channels filtered by chatbot documentId
  const session = await auth()
  const p = await params
  const chatbotDocumentId = String(p?.chatbot || '')

  const qs = new URLSearchParams()
  if (chatbotDocumentId) {
    qs.set('filters[chatbot][documentId][$eq]', chatbotDocumentId)
  }
  const channelUrl = buildStrapiUrl(`/api/channels?${qs.toString()}`)

  let channelRawPayload = null
  let channelError = null
  try {
    const resChan = await fetch(channelUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.strapiToken ? { 'Authorization': `Bearer ${session.strapiToken}` } : {}),
      },
      cache: 'no-store',
    })
    const dataChan = await resChan.json().catch(() => ({}))
    if (!resChan.ok) {
      channelError = dataChan?.error?.message || `No se pudo cargar channels (status ${resChan.status})`
      channelRawPayload = dataChan
    } else {
      channelRawPayload = dataChan
    }
  } catch (e) {
    channelError = 'Error al conectar con Strapi para channels.'
  }

  // Wazend session: build URL and GET /me using channel fields
  const firstChan = Array.isArray(channelRawPayload?.data) && channelRawPayload.data.length
    ? (channelRawPayload.data[0]?.attributes || channelRawPayload.data[0])
    : null
  const sessionUrl = firstChan?.session_url ? String(firstChan.session_url).trim() : null
  const sessionName = firstChan?.session_name || null
  const sessionApiKey = firstChan?.session_apikey ? String(firstChan.session_apikey).trim() : null

  // “Sesión Wazend” ahora se carga en cliente con animación y retraso.
  // Eliminamos el fetch SSR y usamos <WazendSessionMe /> para no bloquear el render inicial.

  // Wazend session (detalle): GET /api/sessions/{session_name}
  let wazendSessionUrl = null
  let wazendSessionPayload = null
  let wazendSessionError = null

  if (sessionUrl && sessionName) {
    const baseUrl = sessionUrl.endsWith('/') ? sessionUrl.slice(0, -1) : sessionUrl
    wazendSessionUrl = `${baseUrl}/api/sessions/${encodeURIComponent(sessionName)}`
    try {
      const resSession = await fetch(wazendSessionUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionApiKey ? { 'X-Api-Key': sessionApiKey } : {}),
        },
        cache: 'no-store',
      })
      const dataSession = await resSession.json().catch(() => ({}))
      if (!resSession.ok) {
        wazendSessionError = dataSession?.error?.message || `No se pudo obtener detalle de sesión (status ${resSession.status})`
        wazendSessionPayload = dataSession
      } else {
        wazendSessionPayload = dataSession
      }
    } catch (e) {
      wazendSessionError = 'Error al conectar con Wazend (detalle de sesión).'
    }
  }

  const maskedApiKey = sessionApiKey ? `${sessionApiKey.slice(0, 4)}…${sessionApiKey.slice(-4)}` : null

  // Wazend profile: ahora se carga en cliente con animación y retraso para mejorar rendimiento.
  // Eliminamos el fetch en servidor y usamos <WazendSessionProfile /> para cargarlo tras el montaje.
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Integración de WhatsApp</h1>
      <p className="text-sm text-muted-foreground">
        Configura la conexión con WhatsApp para tu vendedor inteligente.
      </p>
      <WazendProfileOrConnect sessionUrl={sessionUrl} sessionName={sessionName} apiKey={sessionApiKey} maskedApiKey={maskedApiKey} delayMs={300}>
        <div className="rounded-lg border p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="flex-1 sm:w-1/2">
            <h2 className="text-lg sm:text-xl font-semibold">Conecta tu WhatsApp Business</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Es el primer paso para empezar a vender con tu vendedor inteligente.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8">
              <ConnectNowDialog sessionName={sessionName} />
              <Button variant="outline" className="h-10 px-4" asChild>
                <Link href={`/dashboard/${chatbotDocumentId}/help`}>Contactar con soporte</Link>
              </Button>
            </div>
          </div>
          <div className="w-full sm:w-1/3 h-48 sm:h-100 rounded-md overflow-hidden border relative bg-muted/40">
            <Image
              src="/images/scan-wa.webp"
              alt="Escanea para conectar WhatsApp"
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover object-center"
              priority
            />
          </div>
        </div>
      </WazendProfileOrConnect>

      <div className="rounded-lg border p-6 mt-4">
        <h2 className="text-lg font-semibold">Pasos para conectar</h2>
        <ol className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <li className="rounded-md border p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#54a2b1] text-white text-sm font-semibold">1</span>
              <span className="font-medium">Click a Conectar ahora</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Inicia la vinculación desde EliteSeller.</p>
          </li>
          <li className="rounded-md border p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#54a2b1] text-white text-sm font-semibold">2</span>
              <span className="font-medium">Abre tu WhatsApp y escanea el QR</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Usa la cámara para escanear el código.</p>
          </li>
          <li className="rounded-md border p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#54a2b1] text-white text-sm font-semibold">3</span>
              <span className="font-medium">Verifica tus mensajes</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Confirma que llegan en la pestaña de chats de EliteSeller.</p>
          </li>
        </ol>
      </div>


      {/* <WazendSessionMe sessionUrl={sessionUrl} sessionName={sessionName} apiKey={sessionApiKey} maskedApiKey={maskedApiKey} /> */}



      {/* <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Debug: Channels GET</h2>
        <p className="text-xs text-muted-foreground">URL: {channelUrl}</p>
        <pre className="mt-2 text-xs font-mono bg-muted/30 rounded-md p-3 overflow-auto whitespace-pre">
{channelRawPayload ? JSON.stringify(channelRawPayload, null, 2) : '—'}
        </pre>
      </div> */}
    </div>
  )
}