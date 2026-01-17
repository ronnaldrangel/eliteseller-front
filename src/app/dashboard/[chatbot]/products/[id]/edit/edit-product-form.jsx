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
import RichTextEditor from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CardUpload from "@/components/card-upload";
import { Plus, X, Trash2 } from "lucide-react";
import { useTranslation } from "@/contexts/language-context";
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from "@/constants/currencies";

const SHORT_DESCRIPTION_LIMIT = 1000;
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
  const { t } = useTranslation();
  const attrs = initialData?.attributes || initialData || {};
  const combinationKey = useCallback(
    (combination = {}) => JSON.stringify(combination || {}),
    []
  );

  const [form, setForm] = useState({
    name: attrs.name || "",
    price: (attrs.price ?? "").toString(),
    currency: attrs.currency || DEFAULT_CURRENCY,
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
      const mappedVariants = existingVariants.map((variant) => {
        const inheritProductPrice =
          typeof variant.inherit_product_price === "boolean"
            ? variant.inherit_product_price
            : true;
        const basePrice = (attrs.price ?? "").toString();
        const variantPrice = variant.price?.toString() || "";
        const currentPrice = inheritProductPrice ? basePrice : variantPrice;
        const currentCurrency =
          variant.currency || attrs.currency || DEFAULT_CURRENCY;

        return {
          documentId: variant.documentId,
          combination: variant.combination || {},
          name: Object.values(variant.combination || {}).join(" / "),
          price: currentPrice,
          customPrice: inheritProductPrice ? "" : variantPrice,
          inheritProductPrice,
          currency: currentCurrency,
          is_available: variant.is_available ?? true,
          image: variant.image || null,
          imageUrl: variant.image?.url || null,
          isExisting: true,
        };
      });
      setVariants(mappedVariants);
      setShowVariants(true);
    }
  }, [attrs]);

  // Generar combinaciones de variantes
  const generateVariants = useCallback(() => {
    // 1. Validar si hay opciones ?tiles
    const validOptions = options
      .filter((opt) => opt.name.trim() && opt.values.length > 0)
      .map((opt) => ({
        ...opt,
        values: opt.values.filter((v) => v.trim()),
      }))
      .filter((opt) => opt.values.length > 0);

    // 2. Si no hay opciones v?lidas, limpiamos las variantes y salimos
    if (validOptions.length === 0) {
      setVariants([]);
      // Opcional: Si quieres ocultar la secci?n autom?ticamente:
      // setShowVariants(false);
      return;
    }

    // 3. Generar las combinaciones puras basadas en las opciones actuales
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

    // 4. Actualizar el estado comparando con las variantes PREVIAS (prevVariants)
    // Esto es clave: al usar la funci?n dentro de setVariants, no necesitamos 'variants' en las dependencias
    setVariants((prevVariants) => {
      const comboList = combinations.map((combo) => {
        const combinationObj = {};
        combo.forEach((item) => {
          combinationObj[item.name] = item.value;
        });
        return {
          combinationObj,
          variantName: combo.map((c) => c.value).join(" / "),
        };
      });

      const nextKeys = new Set(
        comboList.map(({ combinationObj }) => combinationKey(combinationObj))
      );
      const removed = prevVariants
        .filter(
          (v) =>
            v.documentId && !nextKeys.has(combinationKey(v.combination || {}))
        )
        .map((v) => v.documentId);
      if (removed.length) {
        setDeletedVariants((prev) =>
          Array.from(new Set([...prev, ...removed]))
        );
      }

      return comboList.map(({ combinationObj, variantName }) => {
        const existing = prevVariants.find(
          (v) =>
            combinationKey(v.combination) === combinationKey(combinationObj)
        );

        const inheritProductPrice = existing?.inheritProductPrice ?? true;
        const existingCustomPrice =
          typeof existing?.customPrice !== "undefined"
            ? existing.customPrice
            : !inheritProductPrice
              ? existing?.price || ""
              : "";

        return {
          combination: combinationObj,
          name: variantName,
          price: inheritProductPrice ? form.price : existing?.price || "",
          customPrice: existingCustomPrice,
          currency: form.currency,
          inheritProductPrice,
          image: existing?.image || null,
          is_available: existing?.is_available ?? true,
        };
      });
    });
  }, [options, form.price, form.currency, combinationKey]);

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
    const newOptions = options.filter((opt) => opt.id !== id);
    setOptions(newOptions);
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
    // setTimeout(generateVariants, 0);
  };

  const updateVariantPrice = (index, price) => {
    setVariants((current) =>
      current.map((variant, i) =>
        i === index
          ? {
            ...variant,
            customPrice: price,
            price,
            inheritProductPrice: false,
          }
          : variant
      )
    );
  };

  const updateVariantAvailability = (index, is_available) => {
    setVariants((current) =>
      current.map((variant, i) =>
        i === index ? { ...variant, is_available } : variant
      )
    );
  };

  const updateVariantImage = (index, file) => {
    setVariants((current) =>
      current.map((variant, i) =>
        i === index ? { ...variant, image: file, imageUrl: null } : variant
      )
    );
  };

  const removeVariantImage = (index) => {
    setVariants((current) =>
      current.map((variant, i) =>
        i === index ? { ...variant, image: null, imageUrl: null } : variant
      )
    );
  };

  const updateVariantInheritance = (index, inheritProductPrice) => {
    setVariants((current) =>
      current.map((variant, i) =>
        i === index
          ? {
            ...variant,
            inheritProductPrice,
            price: inheritProductPrice
              ? form.price
              : variant.customPrice || "",
          }
          : variant
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

  useEffect(() => {
    setVariants((current) =>
      current.map((variant) => ({
        ...variant,
        price: variant.inheritProductPrice ? form.price : variant.price,
        currency: form.currency,
      }))
    );
  }, [form.price, form.currency]);

  useEffect(() => {
    const hasValidOptions = options.some(
      (opt) => opt.name.trim() !== "" && opt.values.some((v) => v.trim() !== "")
    );

    if (!hasValidOptions && variants.length > 0) {
      const removedIds = variants
        .filter((variant) => variant.documentId)
        .map((variant) => variant.documentId);
      if (removedIds.length) {
        setDeletedVariants((prev) =>
          Array.from(new Set([...prev, ...removedIds]))
        );
      }
      setVariants([]);
      setShowVariants(false);
    }
  }, [options, variants]);

  useEffect(() => {
    if (showVariants || variants.length > 0) {
      generateVariants();
    }
  }, [options, generateVariants, showVariants]);

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = t("product.form.errors.nameRequired", {
        fallback: "Ingresa el nombre del producto.",
      });
    }

    const priceNum = Number(form.price);
    if (form.price === "") {
      nextErrors.price = t("product.form.errors.priceRequired", {
        fallback: "Define un precio para el producto.",
      });
    } else if (Number.isNaN(priceNum)) {
      nextErrors.price = t("product.form.errors.priceNumber", {
        fallback: "Ingresa un valor numerico valido.",
      });
    } else if (priceNum < 0) {
      nextErrors.price = t("product.form.errors.pricePositive", {
        fallback: "El precio no puede ser negativo.",
      });
    }

    if (!form.currency) {
      nextErrors.currency = t("product.form.errors.currencyRequired", {
        fallback: "Selecciona una moneda.",
      });
    }

    const invalidVariant = variants.find(
      (variant) =>
        !variant.inheritProductPrice &&
        (variant.customPrice === "" ||
          Number.isNaN(Number(variant.customPrice)) ||
          Number(variant.customPrice) < 0)
    );

    if (invalidVariant) {
      nextErrors.variantPricing = t("product.form.errors.variantPrice", {
        fallback: "Verifica los precios personalizados de las variantes.",
      });
    }

    if (form.description_wsp.length > SHORT_DESCRIPTION_LIMIT) {
      nextErrors.description_wsp = t(
        "product.form.errors.shortDescriptionMax",
        {
          fallback: "Maximo {{limit}} caracteres permitidos.",
          values: { limit: SHORT_DESCRIPTION_LIMIT },
        }
      );
    }

    if (form.description_complete.length > LONG_DESCRIPTION_LIMIT) {
      nextErrors.description_complete = t(
        "product.form.errors.longDescriptionMax",
        {
          fallback: "Maximo {{limit}} caracteres permitidos.",
          values: { limit: LONG_DESCRIPTION_LIMIT },
        }
      );
    }

    if (form.is_auto_delivery) {
      if (!form.auto_delivery_msg.trim()) {
        nextErrors.auto_delivery_msg = t(
          "product.form.errors.autoDeliveryRequired",
          {
            fallback: "Ingresa el mensaje de entrega automatica.",
          }
        );
      } else if (form.auto_delivery_msg.length > LONG_DESCRIPTION_LIMIT) {
        nextErrors.auto_delivery_msg = t(
          "product.form.errors.autoDeliveryMax",
          {
            fallback: "Maximo {{limit}} caracteres permitidos.",
            values: { limit: LONG_DESCRIPTION_LIMIT },
          }
        );
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
          currency: form.currency,
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
              price: Number(
                variant.inheritProductPrice
                  ? form.price || 0
                  : variant.customPrice || 0
              ),
              inherit_product_price: !!variant.inheritProductPrice,
              currency: form.currency,
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

      // Notify any listeners and refresh server cache immediately
      try {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("products:updated", {
              detail: { productId: body?.data?.id || documentId },
            })
          );
        }
      } catch (e) {
        // ignore dispatch errors
      }

      if (typeof router.refresh === "function") {
        router.refresh();
      }

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

    // CORRECCIÓN: Buscamos la primera opción que REALMENTE tenga valores.
    // Antes usabas: const firstOptionName = options[0]?.name;
    // Ahora buscamos la que se usó para generar:
    const activeOption = options.find(
      (opt) => opt.name.trim() && opt.values.some((v) => v.trim())
    );

    const groupByKey = activeOption?.name;

    // Si por alguna razón no encontramos la key (raro si hay variantes), salimos
    if (!groupByKey) return [];

    const groups = {};
    variants.forEach((variant) => {
      // Ahora usamos la key correcta (ej: "color" en vez de "talla")
      const groupKey = variant.combination[groupByKey];

      if (groupKey) {
        // Validación extra para evitar undefined keys
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(variant);
      }
    });

    return Object.entries(groups).map(([key, items]) => ({
      name: key,
      variants: items,
    }));
  }, [variants, options]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 px-2 md:px-4">
      {/* Título principal fuera del card */}
      <div className="mb-8">
        {/* Botón atrás visible solo en mobile - igual que en triggers */}
        <div className="flex items-center gap-2 mb-2 lg:hidden">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const segment = chatbotSlug || chatbotId;
              router.push(`/dashboard/${encodeURIComponent(segment)}/products`);
            }}
          >
            Atrás
          </Button>
          <CardTitle className="text-lg font-semibold">
            Editar producto
          </CardTitle>
        </div>
        <CardTitle className="hidden lg:block text-2xl font-bold mb-2">
          Editar producto
        </CardTitle>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
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

          <CardContent className="space-y-8">
            {/* Nombre del producto con Disponible inline */}
            <div className="flex flex-col md:flex-row gap-6 md:items-start">
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

              <div className="flex items-center gap-2 mt-4 md:mt-9 md:shrink-0">
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
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="description-wsp"
                  className="text-sm font-medium leading-none block min-h-[40px]"
                >
                  Descripción del producto en WhatsApp *
                </label>
                <div className="relative">
                  <RichTextEditor
                    placeholder="Escribe tu mensaje aquí..."
                    value={form.description_wsp}
                    onChange={(val) => {
                      const truncated = val.substring(
                        0,
                        SHORT_DESCRIPTION_LIMIT
                      );
                      setForm((prev) => ({
                        ...prev,
                        description_wsp: truncated,
                      }));
                    }}
                    className="min-h-[100px]"
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
                  className="text-sm font-medium leading-none block min-h-[40px]"
                >
                  Descripción del producto
                </label>
                <div className="relative">
                  <RichTextEditor
                    placeholder="Escribe los detalles aquí..."
                    value={form.description_complete}
                    onChange={(val) => {
                      const truncated = val.substring(
                        0,
                        LONG_DESCRIPTION_LIMIT
                      );
                      setForm((prev) => ({
                        ...prev,
                        description_complete: truncated,
                      }));
                    }}
                    className="min-h-[100px]"
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
            {/* Entrega automática */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none">
                  Mensaje de entrega automática
                </label>
                <div className="flex items-center gap-2">
                  <label htmlFor="product-auto-delivery" className="text-sm font-medium whitespace-nowrap">
                    Entrega automática
                  </label>
                  <Switch
                    id="product-auto-delivery"
                    checked={!!form.is_auto_delivery}
                    onCheckedChange={(value) =>
                      setForm((prev) => ({ ...prev, is_auto_delivery: !!value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <RichTextEditor
                    placeholder="Escribe el mensaje que verán tras la compra..."
                    value={form.auto_delivery_msg}
                    onChange={(val) => {
                      const truncated = val.substring(0, LONG_DESCRIPTION_LIMIT);
                      setForm((prev) => ({ ...prev, auto_delivery_msg: truncated }));
                    }}
                    className="min-h-[100px]"
                    disabled={!form.is_auto_delivery}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-1">
                    {form.auto_delivery_msg.length}/{LONG_DESCRIPTION_LIMIT}
                  </div>
                </div>
                {errors.auto_delivery_msg && (
                  <p className="text-sm text-destructive">{errors.auto_delivery_msg}</p>
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

          <CardContent className="space-y-8">
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
        <Card className="border border-border bg-card shadow-sm overflow-hidden rounded-xl">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl font-semibold">
                  {t("product.form.sections.basePrice.title", {
                    fallback: "Precio general",
                  })}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {variants.length > 0
                    ? t("product.form.sections.basePrice.withVariants", {
                      fallback:
                        "Este precio se utilizara como referencia para todas las variantes.",
                    })
                    : t("product.form.sections.basePrice.description", {
                      fallback:
                        "Este precio se utilizara para la variante principal del producto.",
                    })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-2">
                <label
                  htmlFor="base-price"
                  className="text-sm font-medium leading-none"
                >
                  {t("product.form.fields.basePrice", {
                    fallback: "Precio base",
                  })}
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
                  {t("product.form.fields.basePriceHelper", {
                    fallback: "Este sera el precio principal de tu producto.",
                  })}
                </p>
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  {t("product.form.fields.currency", { fallback: "Moneda" })}
                </label>
                <Select
                  value={form.currency}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, currency: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t(
                        "product.form.fields.currencyPlaceholder",
                        {
                          fallback: "Selecciona una moneda",
                        }
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-sm text-destructive">{errors.currency}</p>
                )}
              </div>
            </div>
            {errors.variantPricing && (
              <p className="text-sm text-destructive">
                {errors.variantPricing}
              </p>
            )}
          </CardContent>
        </Card>{" "}
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

          <CardContent className="space-y-6">
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
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                {options.map((option) => (
                  <div
                    key={option.id}
                    className="rounded-xl border border-muted-foreground/20 bg-background p-5 space-y-4"
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
                <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 bg-muted/40 border-b border-muted-foreground/20 text-sm font-medium">
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
                      {options.find(o => o.name.trim() && o.values.some(v => v.trim()))?.name}: {group.name}
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        {group.variants.length} variante
                        {group.variants.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {group.variants.map((variant, vIndex) => {
                      const globalIndex = variants.indexOf(variant);
                      let imagePreview = null;
                      if (
                        variant.image &&
                        typeof File !== "undefined" &&
                        variant.image instanceof File
                      ) {
                        imagePreview = URL.createObjectURL(variant.image);
                      } else {
                        imagePreview =
                          variant.imageUrl ||
                          (typeof variant.image === "object"
                            ? variant.image?.url
                            : null);
                      }

                      return (
                        <div
                          key={vIndex}
                          className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-4 hover:bg-muted/20 even:bg-muted/10 transition-colors md:items-center"
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
                            <span className="text-xs text-muted-foreground md:hidden">
                              Variante
                            </span>
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

                          <div className="w-full md:w-56 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {t("product.form.variant.priceLabel", {
                                  fallback: "Precio",
                                })}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-muted-foreground">
                                  {t("product.form.variant.useBase", {
                                    fallback: "Usar precio base",
                                  })}
                                </span>
                                <Switch
                                  checked={variant.inheritProductPrice}
                                  onCheckedChange={(checked) =>
                                    updateVariantInheritance(
                                      globalIndex,
                                      checked
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={
                                variant.inheritProductPrice
                                  ? form.price
                                  : variant.customPrice || ""
                              }
                              onChange={(e) =>
                                updateVariantPrice(globalIndex, e.target.value)
                              }
                              className="h-9"
                              disabled={variant.inheritProductPrice}
                            />
                            <p className="text-xs text-muted-foreground">
                              {form.currency}
                            </p>
                          </div>

                          <div className="flex flex-col md:flex-row md:items-center md:justify-center w-full md:w-24">
                            <span className="text-xs text-muted-foreground md:hidden mb-1">
                              Disponibilidad
                            </span>
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
        {/* Footer con botones (mobile) */}
        <div className="bg-background border-t p-4 flex gap-3 lg:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const segment = chatbotSlug || chatbotId;
              router.push(`/dashboard/${encodeURIComponent(segment)}/products`);
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
              router.push(`/dashboard/${encodeURIComponent(segment)}/products`);
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
