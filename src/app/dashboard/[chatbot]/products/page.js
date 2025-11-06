import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import { redirect } from "next/navigation";
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils";
import { columns } from "@/app/dashboard/[chatbot]/products/columns";
import { ProductsClientTable } from "@/app/dashboard/[chatbot]/products/client-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ProductsPage({ params }) {
  const session = await auth();
  const { chatbot: chatbotParam } = await params;
  const chatbotSlug = String(chatbotParam || "");

  if (!session) {
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(
        `/dashboard/${chatbotSlug}/products`
      )}`
    );
  }

  // Obtener el chatbot por slug
  const chatbot = await getChatbotBySlug(
    chatbotSlug,
    session.strapiToken,
    session.user.strapiUserId
  );

  if (!chatbot) {
    redirect("/select");
  }

  // Obtener productos del chatbot
  const qs = new URLSearchParams();
  qs.set("filters[chatbot][documentId][$eq]", chatbot.documentId);

  const url = buildStrapiUrl(
    `/api/products?${qs.toString()}&populate[media][fields][0]=url&populate[media][fields][1]=name`
  );

  let products = [];
  let error = null;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.strapiToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const details = await res.json().catch(() => ({}));
      error =
        details?.error?.message ||
        `No se pudo cargar productos (status ${res.status})`;
    } else {
      const data = await res.json();
      products = Array.isArray(data) ? data : data?.data || [];
    }
  } catch (e) {
    error = "Error al conectar con Strapi. Verifica tu conexión.";
  }

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="py-4 md:py-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Productos registrados</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Visualiza, edita y gestiona todos los productos de tu tienda.
            </p>
          </div>
          <div className="w-full md:w-auto">
            <Button asChild className="w-full md:w-auto">
              <Link
                href={`/dashboard/${chatbotSlug}/products/new`}
                className="whitespace-nowrap"
              >
                Crear producto
              </Link>
            </Button>
          </div>
        </div>

        <div className="pb-6">
          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          ) : (
            <ProductsClientTable columns={columns} data={products} />
          )}
        </div>
      </div>
    </div>
  );
}
