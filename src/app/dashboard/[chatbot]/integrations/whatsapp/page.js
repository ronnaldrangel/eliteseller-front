export default function WhatsAppIntegrationPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Integración de WhatsApp</h1>
      <p className="text-sm text-muted-foreground">
        Configura la conexión con WhatsApp para tu cuenta de EliteSeller.
      </p>
      <div className="rounded-lg border p-4">
        <p className="text-sm">
          Aquí podrás vincular tu número de WhatsApp, gestionar Webhooks y revisar el estado de la integración.
        </p>
        <p className="text-sm mt-2">
          Próximamente: asistente de conexión guiado y verificación de tokens.
        </p>
      </div>
    </div>
  )
}