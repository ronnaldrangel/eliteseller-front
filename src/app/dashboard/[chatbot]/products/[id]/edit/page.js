import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import { redirect } from "next/navigation";
import EditProductForm from "./edit-product-form";
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils";

export default async function EditProductPage({ params }) {
  const session = await auth();
  const { chatbot: chatbotParam, id: documentId } = await params;
  const chatbotSlug = String(chatbotParam || "");

  if (!session) {
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(
        `/dashboard/${chatbotSlug}/products/${documentId}/edit`
      )}`
    );
  }

  const chatbot = await getChatbotBySlug(
    chatbotSlug,
    session.strapiToken,
    session.user.strapiUserId
  );

  if (!chatbot) {
    redirect("/select");
  }

  let product = null;
  let error = null;

  try {
    const res = await fetch(
      buildStrapiUrl(
        `/api/products/${documentId}?` +
          `populate[media][fields][0]=url&` +
          `populate[media][fields][1]=name&` +
          `populate[media][fields][2]=id&` +
          `populate[media][fields][3]=mime&` +
          `populate[media][fields][4]=size&` +
          `populate[product_options][fields][0]=name&` +
          `populate[product_options][fields][1]=values&` +
          `populate[product_options][fields][2]=documentId&` +
          `populate[product_variants][fields][0]=combination&` +
          `populate[product_variants][fields][1]=price&` +
          `populate[product_variants][fields][2]=is_available&` +
          `populate[product_variants][fields][3]=documentId&` +
          `populate[product_variants][populate][image][fields][0]=url&` +
          `populate[product_variants][populate][image][fields][1]=name&` +
          `populate[product_variants][populate][image][fields][2]=id`
      ),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.strapiToken}`,
        },
        cache: "no-store",
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      error =
        data?.error?.message ||
        `No se pudo cargar producto (status ${res.status})`;
    } else {
      product = Array.isArray(data) ? data[0] : data?.data || data;
    }
  } catch (e) {
    error = "Error al conectar con Strapi. Verifica tu conexion.";
  }

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main mx-auto w-full flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        ) : (
          <EditProductForm
            initialData={product}
            token={session.strapiToken}
            chatbotId={chatbot.documentId}
            chatbotSlug={chatbotSlug}
            documentId={documentId}
          />
        )}
      </div>
    </div>
  );
}
