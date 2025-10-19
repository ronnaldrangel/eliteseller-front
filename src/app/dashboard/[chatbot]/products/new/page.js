import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import NewProductForm from "./new-product-form"

export default async function NewProductPage({ params }) {
  const session = await auth()
  const { chatbot: chatbotParam } = await params
  const chatbotDocumentId = String(chatbotParam || '')

  if (!session) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/dashboard/${chatbotDocumentId}/products/new`)}`)
  }

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between py-4 md:py-6">
          <div>
            <h1 className="text-2xl font-semibold">Crear producto</h1>
            <p className="text-sm text-muted-foreground mt-2">Rellena los campos para registrar un nuevo producto.</p>
          </div>
        </div>

        <NewProductForm token={session.strapiToken} chatbotId={chatbotDocumentId} />
      </div>
    </div>
  )
}