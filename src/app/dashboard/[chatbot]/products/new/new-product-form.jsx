"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buildStrapiUrl } from "@/lib/strapi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import CardUpload from "@/components/card-upload";
import { ChevronLeft } from "lucide-react";

const SHORT_DESCRIPTION_LIMIT = 500;
const LONG_DESCRIPTION_LIMIT = 500;

export default function NewProductForm({ token, chatbotId, chatbotSlug }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    price: "",
    available: true,
    description_wsp: "",
    description_complete: "",
    is_auto_delivery: false,
    auto_delivery_msg: "",
  });
  const [errors, setErrors] = useState({});
  const [uploadItems, setUploadItems] = useState([]);
  const [uploadKey, setUploadKey] = useState(() => Date.now());
  const [status, setStatus] = useState({ loading: false, error: null });

  const resetForm = () => {
    setForm({
      name: "",
      price: "",
      available: true,
      description_wsp: "",
      description_complete: "",
      is_auto_delivery: false,
      auto_delivery_msg: "",
    });
    setErrors({});
    setUploadItems([]);
    setUploadKey(Date.now());
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Ingresa el nombre del producto.";
    }

    const priceNum = Number(form.price);
    if (form.price === "") {
      nextErrors.price = "Define un precio para el producto.";
    } else if (Number.isNaN(priceNum)) {
      nextErrors.price = "Ingresa un valor numerico valido.";
    } else if (priceNum < 0) {
      nextErrors.price = "El precio no puede ser negativo.";
    }

    if (form.description_wsp.length > SHORT_DESCRIPTION_LIMIT) {
      nextErrors.description_wsp = `Maximo ${SHORT_DESCRIPTION_LIMIT} caracteres permitidos.`;
    }

    if (form.description_complete.length > LONG_DESCRIPTION_LIMIT) {
      nextErrors.description_complete = `Maximo ${LONG_DESCRIPTION_LIMIT} caracteres permitidos.`;
    }

    if (form.is_auto_delivery) {
      if (!form.auto_delivery_msg.trim()) {
        nextErrors.auto_delivery_msg =
          "Ingresa el mensaje de entrega automática.";
      } else if (form.auto_delivery_msg.length > LONG_DESCRIPTION_LIMIT) {
        nextErrors.auto_delivery_msg = `Maximo ${LONG_DESCRIPTION_LIMIT} caracteres permitidos.`;
      }
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validation = validateForm();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      setStatus({
        loading: false,
        error: "Revisa los campos marcados para continuar con la creacion.",
      });
      return;
    }

    setErrors({});
    setStatus({ loading: true, error: null });

    try {
      const priceNum = Number(form.price);
      const payload = {
        data: {
          name: form.name.trim(),
          price: Number.isFinite(priceNum) ? priceNum : 0,
          available: Boolean(form.available),
          description_wsp: form.description_wsp?.trim() || "",
          description_complete: form.description_complete?.trim() || "",
          is_auto_delivery: !!form.is_auto_delivery,
          auto_delivery_msg: form.is_auto_delivery
            ? form.auto_delivery_msg.trim()
            : "",
        },
      };

      if (chatbotId) {
        payload.data.chatbot = {
          connect: [{ documentId: chatbotId }],
        };
      }

      const newFiles = (uploadItems || [])
        .map((item) => item?.file)
        .filter((file) => typeof File !== "undefined" && file instanceof File);

      if (newFiles.length > 0) {
        const fd = new FormData();
        newFiles.forEach((file) => fd.append("files", file));

        const uploadRes = await fetch(buildStrapiUrl(`/api/upload`), {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: fd,
        });

        const uploaded = await uploadRes.json().catch(() => []);
        if (!uploadRes.ok) {
          const message = Array.isArray(uploaded)
            ? "No se pudieron subir las imagenes."
            : uploaded?.error?.message || "No se pudieron subir las imagenes.";
          setStatus({ loading: false, error: message });
          return;
        }

        const uploadedMediaIds = (Array.isArray(uploaded) ? uploaded : [])
          .map((entry) => entry?.id)
          .filter(Boolean);

        if (uploadedMediaIds.length > 0) {
          payload.data.media = uploadedMediaIds;
        }
      }

      const response = await fetch(buildStrapiUrl(`/api/products`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = body?.error?.message || "No se pudo crear el producto.";
        setStatus({ loading: false, error: message });
        return;
      }

      toast.success("Producto creado correctamente.");
      setStatus({ loading: false, error: null });
      resetForm();

      const segment = chatbotSlug || chatbotId;
      router.push(`/dashboard/${encodeURIComponent(segment)}/products`);
    } catch (error) {
      setStatus({
        loading: false,
        error: "Error de red al crear el producto.",
      });
    }
  };

  const handleUploadChange = useCallback((items) => {
    setUploadItems(items);
  }, []);

  return (
    <div>
      <section className="mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const segment = chatbotSlug || chatbotId;
              router.push(`/dashboard/${encodeURIComponent(segment)}/products`);
            }}
            className="flex items-center text-sm opacity-75 transition-colors hover:text-primary hover:cursor-pointer"
          >
            <ChevronLeft className="inline size-5 mr-2" />
            <span>Atrás</span>
          </button>
          <h3 className="font-medium text-lg">Nuevo Producto</h3>
        </div>
      </section>
      <Card className="border-dashed border-muted-foreground/20 bg-muted/10">
        <CardHeader className="gap-1">
          <CardTitle className="text-xl">Nuevo producto</CardTitle>
          <CardDescription>
            Organiza la informacion en secciones claras y anade recursos
            visuales antes de publicar.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="contents">
          <CardContent className="space-y-8">
            <FieldSet className="gap-8">
              <FieldGroup className="gap-6">
                <FieldLegend>Detalles principales</FieldLegend>
                <div className="grid gap-6 md:grid-cols-2">
                  <Field data-invalid={errors.name ? true : undefined}>
                    <FieldLabel htmlFor="product-name">
                      Nombre del producto
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="product-name"
                        placeholder="Ej. Camiseta premium verano"
                        value={form.name}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            name: event.target.value,
                          }))
                        }
                        required
                        autoComplete="off"
                      />
                      <FieldDescription>
                        Este nombre sera visible en catalogos, respuestas
                        automatizadas y reportes.
                      </FieldDescription>
                      <FieldError>{errors.name}</FieldError>
                    </FieldContent>
                  </Field>

                  <Field data-invalid={errors.price ? true : undefined}>
                    <FieldLabel htmlFor="product-price">Precio</FieldLabel>
                    <FieldContent>
                      <Input
                        id="product-price"
                        inputMode="decimal"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={form.price}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            price: event.target.value,
                          }))
                        }
                        required
                      />
                      <FieldDescription>
                        Indica el precio final mostrado al cliente. Puedes
                        incluir impuestos si aplica.
                      </FieldDescription>
                      <FieldError>{errors.price}</FieldError>
                    </FieldContent>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Disponibilidad</FieldLabel>
                  <FieldContent>
                    <div className="flex flex-col gap-3 rounded-lg border border-muted-foreground/20 bg-background px-4 py-3 md:flex-row md:items-center md:gap-4">
                      <Switch
                        id="product-available"
                        checked={!!form.available}
                        onCheckedChange={(value) =>
                          setForm((previous) => ({
                            ...previous,
                            available: !!value,
                          }))
                        }
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {form.available
                            ? "Producto visible"
                            : "Producto oculto"}
                        </p>
                        <FieldDescription className="text-xs md:text-sm">
                          Controla si el producto aparece en catalogos y
                          respuestas automaticas sin eliminarlo.
                        </FieldDescription>
                      </div>
                    </div>
                  </FieldContent>
                </Field>
              </FieldGroup>

              <FieldSeparator />

              <FieldGroup className="gap-6">
                <FieldLegend>Descripciones y mensajes</FieldLegend>
                <div className="grid gap-6 md:grid-cols-2">
                  <Field
                    data-invalid={errors.description_wsp ? true : undefined}
                  >
                    <FieldLabel htmlFor="product-description-wsp">
                      Texto corto para WhatsApp
                    </FieldLabel>
                    <FieldContent>
                      <Textarea
                        id="product-description-wsp"
                        rows={4}
                        maxLength={SHORT_DESCRIPTION_LIMIT}
                        placeholder="Mensaje breve para compartir por WhatsApp."
                        value={form.description_wsp}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            description_wsp: event.target.value,
                          }))
                        }
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <FieldDescription className="text-xs">
                          Se enviara en respuestas rapidas por WhatsApp.
                        </FieldDescription>
                        <span>
                          {form.description_wsp.length}/
                          {SHORT_DESCRIPTION_LIMIT}
                        </span>
                      </div>
                      <FieldError>{errors.description_wsp}</FieldError>
                    </FieldContent>
                  </Field>

                  <Field
                    data-invalid={
                      errors.description_complete ? true : undefined
                    }
                  >
                    <FieldLabel htmlFor="product-description-complete">
                      Descripcion extendida
                    </FieldLabel>
                    <FieldContent>
                      <Textarea
                        id="product-description-complete"
                        rows={4}
                        maxLength={LONG_DESCRIPTION_LIMIT}
                        placeholder="Comparte caracteristicas, beneficios o instrucciones adicionales."
                        value={form.description_complete}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            description_complete: event.target.value,
                          }))
                        }
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <FieldDescription className="text-xs">
                          Ideal para catalogos completos o fichas tecnicas.
                        </FieldDescription>
                        <span>
                          {form.description_complete.length}/
                          {LONG_DESCRIPTION_LIMIT}
                        </span>
                      </div>
                      <FieldError>{errors.description_complete}</FieldError>
                    </FieldContent>
                  </Field>
                </div>

                <div className="grid gap-4">
                  <Field>
                    <FieldLabel>Entrega automática</FieldLabel>
                    <FieldContent>
                      <div className="flex items-center gap-3 rounded-lg border border-muted-foreground/20 bg-background px-4 py-3">
                        <Switch
                          id="product-auto-delivery"
                          checked={!!form.is_auto_delivery}
                          onCheckedChange={(val) =>
                            setForm((p) => ({
                              ...p,
                              is_auto_delivery: !!val,
                              // si se apaga, limpiamos el mensaje para no enviar ruido
                              auto_delivery_msg: val ? p.auto_delivery_msg : "",
                            }))
                          }
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {form.is_auto_delivery
                              ? "Auto-entrega activada"
                              : "Auto-entrega desactivada"}
                          </p>
                          <FieldDescription className="text-xs">
                            Si está activo, enviaremos automáticamente el
                            siguiente mensaje tras la compra/solicitud.
                          </FieldDescription>
                        </div>
                      </div>
                    </FieldContent>
                  </Field>

                  {form.is_auto_delivery && (
                    <Field
                      data-invalid={errors.auto_delivery_msg ? true : undefined}
                    >
                      <FieldLabel htmlFor="product-auto-delivery-msg">
                        Mensaje de entrega automática
                      </FieldLabel>
                      <FieldContent>
                        <Textarea
                          id="product-auto-delivery-msg"
                          rows={4}
                          maxLength={LONG_DESCRIPTION_LIMIT}
                          placeholder="Escribe el mensaje que recibirá el cliente automáticamente."
                          value={form.auto_delivery_msg}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              auto_delivery_msg: e.target.value,
                            }))
                          }
                        />
                        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {form.auto_delivery_msg.length}/
                            {LONG_DESCRIPTION_LIMIT}
                          </span>
                        </div>
                        <FieldError>{errors.auto_delivery_msg}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                </div>
              </FieldGroup>

              <FieldSeparator />

              <FieldGroup className="gap-6">
                <FieldLegend>Contenido multimedia</FieldLegend>
                <Field>
                  <FieldLabel>Imagenes y videos</FieldLabel>
                  <FieldContent>
                    <FieldDescription>
                      Arrastra tus archivos o seleccionalos desde tu equipo.
                      Acepta JPG, PNG y MP4 (hasta 50&nbsp;MB por archivo).
                    </FieldDescription>
                    <CardUpload
                      key={uploadKey}
                      accept=".jpg,.jpeg,.png,.mp4,video/mp4"
                      multiple
                      simulateUpload={false}
                      defaultFilesEnabled={false}
                      onFilesChange={handleUploadChange}
                    />
                    {uploadItems.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Archivos listos para subir: {uploadItems.length}
                      </p>
                    )}
                  </FieldContent>
                </Field>
              </FieldGroup>
            </FieldSet>

            {status.error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {status.error}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col-reverse gap-3 border-t border-dashed border-muted-foreground/20 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-muted-foreground md:text-sm">
              Se publicara al confirmar y podras editarlo en cualquier momento.
            </div>
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const segment = chatbotSlug || chatbotId;
                  router.push(
                    `/dashboard/${encodeURIComponent(segment)}/products`
                  );
                }}
                className="w-full md:w-auto"
                disabled={status.loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={status.loading || !token || !chatbotId}
              >
                {status.loading ? "Creando..." : "Crear producto"}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
