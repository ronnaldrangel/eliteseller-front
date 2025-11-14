"use client";

import { useCallback, useState, useMemo } from "react";
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
import { ChevronLeft, Plus, X, Trash2 } from "lucide-react";

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

  // Estado para opciones y variantes
  const [options, setOptions] = useState([]);
  const [variants, setVariants] = useState([]);
  const [showVariants, setShowVariants] = useState(false);

  // Generar combinaciones de variantes automáticamente
  const generateVariants = useCallback(() => {
    if (options.length === 0) {
      setVariants([]);
      return;
    }

    const validOptions = options.filter(
      (opt) => opt.name.trim() && opt.values.length > 0
    );

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

    // Crear variantes con formato para Strapi
    const newVariants = combinations.map((combo) => {
      const combinationObj = {};
      combo.forEach((item) => {
        combinationObj[item.name] = item.value;
      });

      const variantName = combo.map((c) => c.value).join(" / ");
      
      // Buscar si ya existe esta variante
      const existing = variants.find(
        (v) => JSON.stringify(v.combination) === JSON.stringify(combinationObj)
      );

      return {
        combination: combinationObj,
        name: variantName,
        price: existing?.price || "",
        image: existing?.image || null,
        is_available: existing?.is_available ?? true,
      };
    });

    setVariants(newVariants);
  }, [options, variants]);

  // Agregar nueva opción
  const addOption = () => {
    setOptions([...options, { id: Date.now(), name: "", values: [] }]);
  };

  // Eliminar opción
  const removeOption = (id) => {
    setOptions(options.filter((opt) => opt.id !== id));
    // Regenerar variantes después de eliminar
    setTimeout(generateVariants, 0);
  };

  // Actualizar nombre de opción
  const updateOptionName = (id, name) => {
    setOptions(
      options.map((opt) => (opt.id === id ? { ...opt, name } : opt))
    );
  };

  // Agregar valor a opción
  const addOptionValue = (id) => {
    setOptions(
      options.map((opt) =>
        opt.id === id
          ? { ...opt, values: [...opt.values, ""] }
          : opt
      )
    );
  };

  // Actualizar valor de opción
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

  // Eliminar valor de opción
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
    // Regenerar variantes después de eliminar valor
    setTimeout(generateVariants, 0);
  };

  // Actualizar precio de variante
  const updateVariantPrice = (index, price) => {
    setVariants(
      variants.map((v, i) => (i === index ? { ...v, price } : v))
    );
  };

  // Actualizar disponibilidad de variante
  const updateVariantAvailability = (index, is_available) => {
    setVariants(
      variants.map((v, i) => (i === index ? { ...v, is_available } : v))
    );
  };

  // Actualizar imagen de variante
  const updateVariantImage = (index, file) => {
    setVariants(
      variants.map((v, i) => (i === index ? { ...v, image: file } : v))
    );
  };

  // Eliminar imagen de variante
  const removeVariantImage = (index) => {
    setVariants(
      variants.map((v, i) => (i === index ? { ...v, image: null } : v))
    );
  };

  // Manejar drop de imagen en variante
  const handleVariantImageDrop = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      updateVariantImage(index, file);
    }
  };

  // Prevenir comportamiento por defecto en drag
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

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
    setOptions([]);
    setVariants([]);
    setShowVariants(false);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Ingresa el nombre del producto.";
    }

    // Si no hay variantes, validar precio base
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

      // Subir imágenes principales del producto
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

      // Crear el producto primero
      const response = await fetch(buildStrapiUrl(`/api/products`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const productBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          productBody?.error?.message || "No se pudo crear el producto.";
        setStatus({ loading: false, error: message });
        return;
      }

      const productId = productBody?.data?.documentId;

      // Si hay opciones, crearlas
      if (options.length > 0) {
        const validOptions = options.filter(
          (opt) => opt.name.trim() && opt.values.length > 0
        );

        for (const option of validOptions) {
          const optionPayload = {
            data: {
              name: option.name.trim(),
              values: option.values.filter((v) => v.trim()),
              product: {
                connect: [{ documentId: productId }],
              },
            },
          };

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

      // Si hay variantes, crearlas
      if (variants.length > 0) {
        for (const variant of variants) {
          let imageId = null;

          // Subir imagen de variante si existe
          if (variant.image) {
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
          }

          const variantPayload = {
            data: {
              combination: variant.combination,
              price: Number(variant.price) || 0,
              is_available: variant.is_available,
              product: {
                connect: [{ documentId: productId }],
              },
            },
          };

          if (imageId) {
            variantPayload.data.image = imageId;
          }

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

      toast.success("Producto creado correctamente.");
      setStatus({ loading: false, error: null });
      resetForm();

      const segment = chatbotSlug || chatbotId;
      router.push(`/dashboard/${encodeURIComponent(segment)}/products`);
    } catch (error) {
      console.error("Error creating product:", error);
      setStatus({
        loading: false,
        error: "Error de red al crear el producto.",
      });
    }
  };

  const handleUploadChange = useCallback((items) => {
    setUploadItems(items);
  }, []);

  // Agrupar variantes por primera opción (ej: talla)
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
              {/* Detalles principales */}
              {/* Detalles principales - Nombre y Disponibilidad */}
              <FieldGroup className="gap-6">
                <FieldLegend>Detalles principales</FieldLegend>
                
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

              {/* Precio base - Solo visible sin variantes */}
              {variants.length === 0 && (
                <>
                  <FieldSeparator />
                  <FieldGroup className="gap-6">
                    <FieldLegend>Precio</FieldLegend>
                    <Field data-invalid={errors.price ? true : undefined}>
                      <FieldLabel htmlFor="product-price">Precio base</FieldLabel>
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
                          Precio cuando no hay variantes definidas.
                        </FieldDescription>
                        <FieldError>{errors.price}</FieldError>
                      </FieldContent>
                    </Field>
                  </FieldGroup>
                </>
              )}

              <FieldSeparator />

              {/* Opciones del producto (variantes) */}
              <FieldGroup className="gap-6">
                <div className="flex items-center justify-between">
                  <FieldLegend>Opciones del producto</FieldLegend>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar opción
                  </Button>
                </div>
                <FieldDescription>
                  Define opciones como talla, color, etc. para crear variantes
                  del producto.
                </FieldDescription>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {options.map((option, optIndex) => (
                    <div
                      key={option.id}
                      className="rounded-lg border border-muted-foreground/20 bg-background p-4 space-y-4"
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
                          <div key={valueIndex} className="flex items-center gap-2">
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
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar valor
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {options.length > 0 && (
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => {
                      generateVariants();
                      setShowVariants(true);
                    }}
                  >
                    Generar variantes
                  </Button>
                )}
              </FieldGroup>

              {/* Variantes generadas */}
              {showVariants && variants.length > 0 && (
                <>
                  <FieldSeparator />
                  <FieldGroup className="gap-6">
                    <FieldLegend>
                      Variantes ({variants.length} combinaciones)
                    </FieldLegend>
                    <FieldDescription>
                      Define el precio e imagen para cada variante.
                    </FieldDescription>

                    <div className="space-y-6">
                      {groupedVariants.map((group) => (
                        <div key={group.name} className="space-y-3">
                          <h4 className="font-medium text-sm">
                            {options[0]?.name}: {group.name}
                          </h4>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {group.variants.map((variant, vIndex) => {
                              const globalIndex = variants.indexOf(variant);
                              const imagePreview = variant.image
                                ? URL.createObjectURL(variant.image)
                                : null;

                              return (
                                <div
                                  key={vIndex}
                                  className="flex flex-col gap-3 p-4 rounded-lg border border-muted-foreground/20 bg-muted/5"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    {Object.entries(variant.combination).map(
                                      ([key, val]) => (
                                        <span
                                          key={key}
                                          className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium"
                                        >
                                          {key}: {val}
                                        </span>
                                      )
                                    )}
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="Precio"
                                      value={variant.price}
                                      onChange={(e) =>
                                        updateVariantPrice(
                                          globalIndex,
                                          e.target.value
                                        )
                                      }
                                    />
                                    
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={variant.is_available}
                                        onCheckedChange={(val) =>
                                          updateVariantAvailability(
                                            globalIndex,
                                            val
                                          )
                                        }
                                      />
                                      <span className="text-xs text-muted-foreground">
                                        Disponible
                                      </span>
                                    </div>
                                    
                                    <div>
                                      <label className="text-xs text-muted-foreground block mb-2">
                                        Imagen de la variante
                                      </label>
                                      
                                      {!variant.image ? (
                                        <div
                                          onDrop={(e) => handleVariantImageDrop(globalIndex, e)}
                                          onDragOver={handleDragOver}
                                          className="relative border-2 border-dashed border-muted-foreground/40 rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer bg-background"
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
                                          <div className="flex flex-col items-center justify-center gap-2 text-center">
                                            <svg
                                              className="w-8 h-8 text-muted-foreground"
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
                                            <div className="text-xs text-muted-foreground">
                                              <span className="font-medium text-primary">
                                                Examinar
                                              </span>{" "}
                                              o arrastra aquí
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="relative rounded-lg overflow-hidden border border-muted-foreground/20">
                                          <img
                                            src={imagePreview}
                                            alt={variant.name}
                                            className="w-full h-32 object-cover"
                                          />
                                          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button
                                              type="button"
                                              variant="secondary"
                                              size="sm"
                                              onClick={() => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.accept = 'image/*';
                                                input.onchange = (e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    updateVariantImage(globalIndex, file);
                                                  }
                                                };
                                                input.click();
                                              }}
                                            >
                                              Cambiar
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="destructive"
                                              size="sm"
                                              onClick={() => removeVariantImage(globalIndex)}
                                            >
                                              Eliminar
                                            </Button>
                                          </div>
                                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                                            <p className="text-xs text-white truncate">
                                              {variant.image.name}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </FieldGroup>
                </>
              )}

              <FieldSeparator />

              {/* Descripciones */}
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
                          {form.description_wsp.length}/{SHORT_DESCRIPTION_LIMIT}
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

              {/* Contenido multimedia */}
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