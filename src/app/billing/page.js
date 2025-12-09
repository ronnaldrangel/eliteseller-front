import MarketingLayout from "@/components/marketing-layout";
import Link from "next/link";
import AffiliatePaymentCta from "@/components/affiliate-payment-cta";
import ChangeCardCta from "@/components/change-card-cta";
import { auth } from "@/lib/auth";
import { buildStrapiUrl } from "@/lib/strapi";

export default async function BillingPage() {
  // Obtener sesión y construir consulta a Strapi por customers del usuario logueado
  const session = await auth();
  const email = (session?.user?.email || "").trim();
  // Construir la query manualmente sin URLSearchParams para un único filtro
  const query = email ? `filters[email][$eq]=${encodeURIComponent(email)}` : "";
  const customersUrl = buildStrapiUrl(
    `/api/customers${query ? `?${query}` : ""}`
  );

  let customersRawPayload = null;
  let customersError = null;
  try {
    const res = await fetch(customersUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(session?.strapiToken
          ? { Authorization: `Bearer ${session.strapiToken}` }
          : {}),
      },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      customersError =
        data?.error?.message ||
        `No se pudo cargar customers (status ${res.status})`;
      customersRawPayload = data;
    } else {
      customersRawPayload = data;
    }
  } catch (e) {
    customersError = "Error al conectar con Strapi para customers.";
  }

  const customer = customersRawPayload?.data?.[0] || null;
  const statusLabel = customer?.customer_status === 1 ? "Activo" : "Inactivo";
  const statusClass =
    customer?.customer_status === 1
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  const payMethod = (() => {
    if (!customer) return "—";
    if (customer.pay_mode === "manual") return "Facturación manual";
    if (customer.creditCardType)
      return `${customer.creditCardType}`;
    return "Método no especificado";
  })();

  const payMethodLast4 = customer?.last4CardDigits
    ? `•••• ${customer.last4CardDigits}`
    : "—";

  return (
    <MarketingLayout>
      <div className="mt-2">
        <h1 className="text-2xl font-semibold">Facturación</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Información de pagos y métodos de facturación.
        </p>
      </div>

      {/* Estado vacío si no hay customer */}
      {!customersError && !customer ? (
        <div className="mt-8 rounded-lg border p-10 text-center bg-muted/30">
          <div className="mx-auto max-w-md space-y-2">
            <p className="text-lg font-medium">Sin datos de facturación</p>
            <p className="text-sm text-muted-foreground">
              No tienes un método de pago afiliado todavía.
            </p>
            <div className="mt-6">
              <AffiliatePaymentCta userId={session?.user?.strapiUserId} />
            </div>
          </div>
        </div>
      ) : (
        /* Diseño con datos del cliente */
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Resumen del cliente */}
          <div className="rounded-lg border p-6">
            <h3 className="text-sm font-semibold">Cliente</h3>
            {customersError ? (
              <p className="mt-2 text-xs text-destructive">{customersError}</p>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <div>
                    <div className="mb-2">
                      <p className="text-base font-medium">
                        {customer?.name || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {customer?.email || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Usuario</p>
                    <p className="font-medium">{customer?.externalId || "—"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Método de pago */}
          <div className="rounded-lg border p-6">
            <h3 className="text-sm font-semibold">Método de pago</h3>
            <div className="mt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm">{payMethod}</p>
                <p className="text-sm">{payMethodLast4}</p>
              </div>
              {customer?.pay_mode === "manual" ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Tu facturación es manual. Contacta soporte para actualizar el
                  método.
                </p>
              ) : null}
            </div>
            <div className="mt-4 flex justify-start gap-2">
              <ChangeCardCta userId={session?.user?.strapiUserId} />
              <Link
                href="/plans"
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Ver planes
              </Link>
            </div>
          </div>
        </div>
      )}
    </MarketingLayout>
  );
}
