'use client'
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import IframeWithPreloader from "@/components/iframe-with-preloader"

export default function ChatsPage({ params }) {
  const [crmUrl, setCrmUrl] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadCRM = async () => {
      try {
        const res = await fetch('/api/crm/login', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store',
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data?.url) {
          setCrmUrl(data.url)
        } else {
          setError(data?.error || 'No se pudo obtener la URL del CRM')
        }
      } catch (e) {
        setError('Error de red al cargar CRM')
      }
    }
    loadCRM()
  }, [])

  if (!crmUrl && !error) {
    return <>
      <div className="flex flex-1 flex-col">
        <div>
          Cargando CRM...
        </div>
      </div>
    </>
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">

        <div className="flex flex-col">


          <div className="relative w-full h-[calc(100vh)]">
            <IframeWithPreloader
              src={crmUrl || "about:blank"}
              title="Chats embebidos"
              className="w-full h-full"
            />
          </div>

          <div className="px-4 lg:px-6">
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm mb-2">
                {error}
              </div>
            )}
            <Button asChild>
              <Link href="/api/crm/login?redirect=1" target="_blank" rel="noopener noreferrer">
                Accede a tus chats
              </Link>
            </Button>

          </div>

        </div>
      </div>
    </div>
  );
}