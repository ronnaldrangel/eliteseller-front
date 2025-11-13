import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";
import { redirect } from "next/navigation";
import { getChatbotBySlug } from "@/lib/utils/chatbot-utils";
import { ContactsClientTable } from "./client-table";
import { columns } from "./columns";

export default async function ContactsPage({ params }) {
  const session = await auth();
  const chatbotSlug = String(params?.chatbot || "");

  if (!session) {
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(
        `/dashboard/${chatbotSlug}/contacts`
      )}`
    );
  }

  const chatbot = await getChatbotBySlug(
    chatbotSlug,
    session.strapiToken,
    session.user.strapiUserId
  );
  if (!chatbot) redirect("/select");

  // Obtener Contacts del chatbot
  const qs = new URLSearchParams();
  qs.set("filters[chatbot][documentId][$eq]", chatbot.documentId);

  const url = buildStrapiUrl(`/api/contacts?${qs.toString()}`);
  // const url = buildStrapiUrl(`/api/contacts`);

  let contacts = [];
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
        `No se pudo cargar contactos (status ${res.status})`;
    } else {
      const data = await res.json();
      contacts = Array.isArray(data) ? data : data?.data || [];
    }
  } catch (e) {
    error = "Error al conectar con Strapi. Verifica tu conexión.";
  }

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="py-4 md:py-6">
          <h1 className="text-2xl font-semibold">Contactos</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Visualiza los contactos vinculados a este chatbot.
          </p>
        </div>

        <div className="pb-6">
          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          ) : (
            <ContactsClientTable columns={columns} data={contacts} />
          )}
        </div>
      </div>
    </div>
  );
}
