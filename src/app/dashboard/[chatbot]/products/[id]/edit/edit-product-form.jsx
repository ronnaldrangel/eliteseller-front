"use client";

import { useCallback, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buildStrapiUrl } from "@/lib/strapi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import CardUpload from "@/components/card-upload";
import { Plus, X, Trash2 } from "lucide-react";

const SHORT_DESCRIPTION_LIMIT = 500;
const LONG_DESCRIPTION_LIMIT = 1000;
const NAME_LIMIT = 250;

export default function EditProductForm({
  initialData,
  token,
  chatbotId,
  chatbotSlug,
  documentId,
}) {
  const router = useRouter();
  const attrs = initialData?.attributes || initialData || {};

  const [form, setForm] = useState({
    name: attrs.name || "",
    price: (attrs.price ?? "").toString(),
    available: typeof attrs.available === "boolean" ? attrs.available : true,
    description_wsp: attrs.description_wsp || "",
    description_complete: attrs.description_complete || "",
    is_auto_delivery:
      typeof attrs.is_auto_delivery === "boolean"
        ? attrs.is_auto_delivery
        : false,
    auto_delivery_msg: attrs.auto_delivery_msg || "",
  });
  const [errors, setErrors] = useState({});
  const [uploadItems, setUploadItems] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: null });

  // Estado para opciones y variantes
  const [options, setOptions] = useState([]);
  const [variants, setVariants] = useState([]);
  const [showVariants, setShowVariants] = useState(false);
  const [deletedOptions, setDeletedOptions] = useState([]);
  const [deletedVariants, setDeletedVariants] = useState([]);

  const existingMedia = Array.isArray(attrs?.media) ? attrs.media : [];

  // Cargar opciones y variantes existentes
  useEffect(() => {
    const existingOptions = attrs?.product_options || [];
    const existingVariants = attrs?.product_variants || [];

    if (existingOptions.length > 0) {
      const mappedOptions = existingOptions.map((opt) => ({
        id: opt.documentId || Date.now() + Math.random(),
        documentId: opt.documentId,
        name: opt.name || "",
        values: Array.isArray(opt.values) ? opt.values : [],
        isExisting: true,
      }));
      setOptions(mappedOptions);
    }

    if (existingVariants.length > 0) {
      const mappedVariants = existingVariants.map((variant) => ({
        documentId: variant.documentId,
        combination: variant.combination || {},
        name: Object.values(variant.combination || {}).join(" / "),
        price: variant.price?.toString() || "",
        is_available: variant.is_available ?? true,
        image: variant.image || null,
        imageUrl: variant.image?.url || null,
        isExisting: true,
      }));
      setVariants(mappedVariants);
      setShowVariants(true);
    }
  }, [attrs]);

  // Generar combinaciones de variantes
  const generateVariants = useCallback(() => {
    if (options.length === 0) {
      setVariants([]);
      return;
    }

    const validOptions = options
      .filter((opt) => opt.name.trim() && opt.values.length > 0)
      .map((opt) => ({
        ...opt,
        values: opt.values.filter((v) => v.trim()),
      }))
      .filter((opt) => opt.values.length > 0);

    if (validOptions.length === 0) {
      setVariants([]);
      return;
    }

    const combinations = [];

    const generateCombinations = (currentIndex, currentCombination) => {
      if (currentIndex === validOptions.length) {
        combinations.push([...currentCombination]);
        return;
      }

      const option = validOptions[currentIndex];
      for (const value of option.values) {
        generateCombinations(currentIndex + 1, [
          ...currentCombination,
          { name: option.name, value },
        ]);
      }
    };

    generateCombinations(0, []);

    const newVariants = combinations.map((combo) => {
      const combinationObj = {};
      combo.forEach((item) => {
        combinationObj[item.name] = item.value;
      });

      const variantName = combo.map((c) => c.value).join(" / ");

      const existing = variants.find(
        (v) => JSON.stringify(v.combination) === JSON.stringify(combinationObj)
      );

      return {
        documentId: existing?.documentId,
        combination: combinationObj,
        name: variantName,
        price: existing?.price || "",
        image: existing?.image || null,
        imageUrl: existing?.imageUrl || null,
        is_available: existing?.is_available ?? true,
        isExisting: !!existing?.documentId,
      };
    });

    setVariants(newVariants);
  }, [options, variants]);

  const addOption = () => {
    setOptions([
      ...options,
      { id: Date.now(), name: "", values: [], isExisting: false },
    ]);
  };

  const removeOption = (id) => {
    const option = options.find((opt) => opt.id === id);
    if (option?.documentId) {
      setDeletedOptions([...deletedOptions, option.documentId]);
    }
    setOptions(options.filter((opt) => opt.id !== id));
    setTimeout(generateVariants, 0);
  };

  const updateOptionName = (id, name) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, name } : opt)));
  };

  const addOptionValue = (id) => {
    setOptions(
      options.map((opt) => {
        if (opt.id === id) {
          const hasEmptyValues = opt.values.some((v) => !v.trim());
          if (hasEmptyValues) {
            return opt;
          }
          return { ...opt, values: [...opt.values, ""] };
        }
        return opt;
      })
    );
  };

  const updateOptionValue = (optionId, valueIndex, value) => {
    setOptions(
      options.map((opt) =>
        opt.id === optionId
          ? {
              ...opt,
              values: opt.values.map((v, i) => (i === valueIndex ? value : v)),
            }
          : opt
      )
    );
  };

  const removeOptionValue = (optionId, valueIndex) => {
    setOptions(
      options.map((opt) =>
        opt.id === optionId
          ? {
              ...opt,
              values: opt.values.filter((_, i) => i !== valueIndex),
            }
          : opt
      )
    );
    setTimeout(generateVariants, 0);
  };

  const updateVariantPrice = (index, price) => {
    setVariants(variants.map((v, i) => (i === index ? { ...v, price } : v)));
  };

  const updateVariantAvailability = (index, is_available) => {
    setVariants(
      variants.map((v, i) => (i === index ? { ...v, is_available } : v))
    );
  };

  const updateVariantImage = (index, file) => {
    setVariants(
      variants.map((v, i) =>
        i === index ? { ...v, image: file, imageUrl: null } : v
      )
    );
  };

  const removeVariantImage = (index) => {
    setVariants(
      variants.map((v, i) =>
        i === index ? { ...v, image: null, imageUrl: null } : v
      )
    );
  };

  const handleVariantImageDrop = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      updateVariantImage(index, file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Ingresa el nombre del producto.";
    }

    if (variants.length === 0) {
      const priceNum = Number(form.price);
      if (form.price === "") {
        nextErrors.price = "Define un precio para el producto.";
      } else if (Number.isNaN(priceNum)) {
        nextErrors.price = "Ingresa un valor numerico valido.";
      } else if (priceNum < 0) {
        nextErrors.price = "El precio no puede ser negativo.";
      }
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
        error:
          "Revisa los campos marcados para continuar con la actualización.",
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
          set: [{ documentId: chatbotId }],
        };
      }

      const newFiles = (uploadItems || [])
        .map((item) => item?.file)
        .filter((file) => typeof File !== "undefined" && file instanceof File);

      let uploadedMediaIds = [];
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

        uploadedMediaIds = (Array.isArray(uploaded) ? uploaded : [])
          .map((entry) => entry?.id)
          .filter(Boolean);
      }

      const existingMediaIds = (uploadItems || [])
        .map((item) => item?.file)
        .filter((f) => !(typeof File !== "undefined" && f instanceof File))
        .map((f) => f?.id)
        .filter(Boolean);

      const finalMedia = [...existingMediaIds, ...uploadedMediaIds];
      if (finalMedia.length > 0) {
        payload.data.media = finalMedia;
      } else {
        payload.data.media = [];
      }

      const response = await fetch(
        buildStrapiUrl(`/api/products/${documentId}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          body?.error?.message || "No se pudo actualizar el producto.";
        setStatus({ loading: false, error: message });
        return;
      }

      for (const optionId of deletedOptions) {
        await fetch(buildStrapiUrl(`/api/product-options/${optionId}`), {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      }

      for (const variantId of deletedVariants) {
        await fetch(buildStrapiUrl(`/api/product-variants/${variantId}`), {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      }

      if (options.length > 0) {
        const validOptions = options.filter(
          (opt) => opt.name.trim() && opt.values.length > 0
        );

        for (const option of validOptions) {
          const optionPayload = {
            data: {
              name: option.name.trim(),
              values: option.values.filter((v) => v.trim()),
              product: documentId,
            },
          };

          if (option.documentId) {
            await fetch(
              buildStrapiUrl(`/api/product-options/${option.documentId}`),
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(optionPayload),
              }
            );
          } else {
            await fetch(buildStrapiUrl(`/api/product-options`), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(optionPayload),
            });
          }
        }
      }

      if (variants.length > 0) {
        for (const variant of variants) {
          let imageId = null;

          if (
            variant.image &&
            typeof File !== "undefined" &&
            variant.image instanceof File
          ) {
            const fd = new FormData();
            fd.append("files", variant.image);

            const uploadRes = await fetch(buildStrapiUrl(`/api/upload`), {
              method: "POST",
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: fd,
            });

            const uploaded = await uploadRes.json().catch(() => []);
            if (uploadRes.ok && Array.isArray(uploaded) && uploaded[0]?.id) {
              imageId = uploaded[0].id;
            }
          } else if (variant.image?.id) {
            imageId = variant.image.id;
          }

          const variantPayload = {
            data: {
              combination: variant.combination,
              price: Number(variant.price) || 0,
              is_available: variant.is_available,
              product: documentId,
            },
          };

          if (imageId) {
            variantPayload.data.image = imageId;
          }

          if (variant.documentId) {
            await fetch(
              buildStrapiUrl(`/api/product-variants/${variant.documentId}`),
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(variantPayload),
              }
            );
          } else {
            await fetch(buildStrapiUrl(`/api/product-variants`), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(variantPayload),
            });
          }
        }
      }

      toast.success("Producto actualizado correctamente.");
      setStatus({ loading: false, error: null });

      const segment = chatbotSlug || chatbotId;
      router.push(`/dashboard/${encodeURIComponent(segment)}/products`);
    } catch (error) {
      console.error("Error updating product:", error);
      setStatus({
        loading: false,
        error: "Error de red al actualizar el producto.",
      });
    }
  };

  const handleUploadChange = useCallback((items) => {
    setUploadItems(items);
  }, []);

  const groupedVariants = useMemo(() => {
    if (variants.length === 0) return [];

    const firstOptionName = options[0]?.name;
    if (!firstOptionName) return [];

    const groups = {};
    variants.forEach((variant) => {
      const groupKey = variant.combination[firstOptionName];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(variant);
    });

    return Object.entries(groups).map(([key, items]) => ({
      name: key,
      variants: items,
    }));
  }, [variants, options]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Título principal fuera del card */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Editar producto
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <Card className="border border-border bg-card shadow-sm overflow-hidden rounded-xl">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl font-semibold">
                  Información básica
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Actualiza la información básica de tu producto
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Nombre del producto con Disponible inline */}
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <label
                  htmlFor="product-name"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Nombre del producto *
                </label>
                <div className="relative mt-2">
                  <Input
                    id="product-name"
                    placeholder="Ej: Camiseta de algodón"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    maxLength={NAME_LIMIT}
                    className="pr-16"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-background px-1">
                    {form.name.length}/{NAME_LIMIT}
                  </div>
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div className="flex items-center gap-2 mt-9">
                <label
                  htmlFor="product-available"
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Disponible
                </label>
                <Switch
                  id="product-available"
                  checked={!!form.available}
                  onCheckedChange={(value) =>
                    setForm((prev) => ({ ...prev, available: !!value }))
                  }
                />
              </div>
            </div>

            {/* Grid de descripciones */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="description-wsp"
                  className="text-sm font-medium leading-none"
                >
                  Descripción del producto en WhatsApp *
                </label>
                <div className="relative">
                  <Textarea
                    id="description-wsp"
                    placeholder="Escribe tu mensaje aquí..."
                    value={form.description_wsp}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description_wsp: e.target.value,
                      }))
                    }
                    maxLength={SHORT_DESCRIPTION_LIMIT}
                    className="min-h-[100px] resize-none"
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-1">
                    {form.description_wsp.length}/{SHORT_DESCRIPTION_LIMIT}
                  </div>
                </div>
                {errors.description_wsp && (
                  <p className="text-sm text-destructive">
                    {errors.description_wsp}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="description-complete"
                  className="text-sm font-medium leading-none"
                >
                  Descripción del producto
                </label>
                <div className="relative">
                  <Textarea
                    id="description-complete"
                    placeholder="Escribe los detalles aquí..."
                    value={form.description_complete}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description_complete: e.target.value,
                      }))
                    }
                    maxLength={LONG_DESCRIPTION_LIMIT}
                    className="min-h-[100px] resize-none"
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-1">
                    {form.description_complete.length}/{LONG_DESCRIPTION_LIMIT}
                  </div>
                </div>
                {errors.description_complete && (
                  <p className="text-sm text-destructive">
                    {errors.description_complete}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Imágenes y videos */}
        <Card className="border border-border bg-card shadow-sm overflow-hidden rounded-xl">
          <CardHeader>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl font-semibold">
                Imágenes y videos
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Actualiza las imágenes y videos de tu producto
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <CardUpload
              accept=".jpg,.jpeg,.png,.mp4,video/mp4"
              multiple
              simulateUpload={false}
              defaultFilesEnabled={false}
              initialFiles={existingMedia.map((m) => ({
                id: m?.id,
                name: m?.name || `Imagen`,
                size: typeof m?.size === "number" ? m.size : 0,
                type: m?.mime || "image/jpeg",
                url: m?.url,
              }))}
              onFilesChange={handleUploadChange}
            />
          </CardContent>
        </Card>

        {/* Precio general */}
        {variants.length === 0 && (
          <Card className="border border-border bg-card shadow-sm overflow-hidden rounded-xl">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-xl font-semibold">
                    Precio general
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Este precio se utilizará para la variante principal del
                    producto
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="base-price"
                  className="text-sm font-medium leading-none"
                >
                  Precio base
                </label>
                <div className="relative">
                  <Input
                    id="base-price"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={form.price}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, price: e.target.value }))
                    }
                    className="h-12 text-base"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Este será el precio de tu producto. Se guardará internamente
                  como una variante principal.
                </p>
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Editar variaciones */}
        <Card className="border border-border bg-card shadow-sm overflow-hidden rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl font-semibold">
                  Editar variaciones
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Gestiona las diferentes opciones de tu producto, como color,
                  talla o material.
                </CardDescription>
              </div>
              
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <button
              type="button"
              onClick={addOption}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-accent h-10 px-4 py-2 text-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar opción
            </button>

            {/* Lista de opciones */}
            {options.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                {options.map((option) => (
                  <div
                    key={option.id}
                    className="rounded-xl border border-muted-foreground/20 bg-background p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <Input
                          placeholder="Ej. Talla, Color..."
                          value={option.name}
                          onChange={(e) =>
                            updateOptionName(option.id, e.target.value)
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(option.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Valores disponibles
                      </p>
                      {option.values.map((value, valueIndex) => (
                        <div
                          key={valueIndex}
                          className="flex items-center gap-2"
                        >
                          <Input
                            placeholder="Valor"
                            value={value}
                            onChange={(e) =>
                              updateOptionValue(
                                option.id,
                                valueIndex,
                                e.target.value
                              )
                            }
                            className={
                              !value.trim() && value !== ""
                                ? "border border-destructive"
                                : ""
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              removeOptionValue(option.id, valueIndex)
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOptionValue(option.id)}
                        className="w-full"
                        disabled={option.values.some((v) => !v.trim())}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar valor
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {options.length > 0 && (
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  generateVariants();
                  setShowVariants(true);
                }}
                className="mt-4"
              >
                Generar variantes
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Variantes generadas */}
        {showVariants && variants.length > 0 && (
          <Card className="border border-border bg-card shadow-sm overflow-hidden rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                Variantes ({variants.length} combinaciones)
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Define el precio e imagen para cada variante.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="rounded-xl border border-muted-foreground/20 bg-background overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 bg-muted/40 border-b border-muted-foreground/20 text-sm font-medium">
                  <div>Imagen</div>
                  <div>Variante</div>
                  <div>Precio</div>
                  <div>Disponibilidad</div>
                </div>

                {groupedVariants.map((group) => (
                  <div
                    key={group.name}
                    className="border-b border-muted-foreground/20 last:border-b-0"
                  >
                    <div className="px-4 py-3 bg-muted/20 font-medium text-sm">
                      {options[0]?.name}: {group.name}
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        {group.variants.length} variante
                        {group.variants.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {group.variants.map((variant, vIndex) => {
                      const globalIndex = variants.indexOf(variant);
                      const imagePreview =
                        variant.image &&
                        typeof File !== "undefined" &&
                        variant.image instanceof File
                          ? URL.createObjectURL(variant.image)
                          : variant.imageUrl;

                      return (
                        <div
                          key={vIndex}
                          className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-4 hover:bg-muted/20 transition-colors items-center"
                        >
                          <div className="relative">
                            {!imagePreview ? (
                              <div
                                onDrop={(e) =>
                                  handleVariantImageDrop(globalIndex, e)
                                }
                                onDragOver={handleDragOver}
                                className="relative w-20 h-20 border-2 border-dashed border-muted-foreground/40 rounded-xl hover:border-primary/50 transition-colors cursor-pointer bg-muted/10 flex items-center justify-center group"
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      updateVariantImage(globalIndex, file);
                                    }
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <svg
                                  className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            ) : (
                              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-muted-foreground/20 group">
                                <img
                                  src={imagePreview}
                                  alt={variant.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      const input =
                                        document.createElement("input");
                                      input.type = "file";
                                      input.accept = "image/*";
                                      input.onchange = (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          updateVariantImage(globalIndex, file);
                                        }
                                      };
                                      input.click();
                                    }}
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                      />
                                    </svg>
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      removeVariantImage(globalIndex)
                                    }
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 items-center pr-4">
                            <span className="text-sm font-medium shrink-0">
                              {vIndex + 1}
                            </span>
                            {Object.entries(variant.combination).map(
                              ([key, val]) => (
                                <span
                                  key={key}
                                  className="text-xs px-2 py-1 rounded-md bg-muted text-foreground border border-muted-foreground/20 shrink-0"
                                >
                                  {key}: {val}
                                </span>
                              )
                            )}
                          </div>

                          <div className="w-16 md:w-32">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={variant.price}
                              onChange={(e) =>
                                updateVariantPrice(globalIndex, e.target.value)
                              }
                              className="h-9"
                            />
                          </div>

                          <div className="flex items-center justify-center w-12 md:w-24">
                            <Switch
                              checked={variant.is_available}
                              onCheckedChange={(val) =>
                                updateVariantAvailability(globalIndex, val)
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer con botones */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex gap-3 lg:hidden z-50">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const segment = chatbotSlug || chatbotId;
              router.push(
                `/dashboard/${encodeURIComponent(segment)}/products`
              );
            }}
            className="flex-1"
            disabled={status.loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={status.loading || !token || !chatbotId}
          >
            {status.loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>

        {/* Botones desktop (ocultos en mobile) */}
        <div className="hidden lg:flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const segment = chatbotSlug || chatbotId;
              router.push(
                `/dashboard/${encodeURIComponent(segment)}/products`
              );
            }}
            disabled={status.loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={status.loading || !token || !chatbotId}
          >
            {status.loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>

        {status.error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {status.error}
          </div>
        )}
      </form>
    </div>
  );
}