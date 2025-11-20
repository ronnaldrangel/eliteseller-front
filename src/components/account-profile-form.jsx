"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { isValidPhoneNumber } from "react-phone-number-input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { useTranslation } from "@/contexts/language-context";

export default function AccountProfileForm({
  initialName = "",
  initialPhone = "",
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState(initialName || "");
  const [phone, setPhone] = useState(initialPhone || "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};

    if (phone && !isValidPhoneNumber(phone)) {
      nextErrors.phone = t("account.profile.errors.invalidPhone", {
        fallback: "Ingresa un numero telefonico valido.",
      });
    }

    return nextErrors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      toast.error(
        t("account.profile.errors.validation", {
          fallback: "Revisa los campos marcados para continuar.",
        })
      );
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const payload = {
        name: name?.trim() || "",
        phone: phone || "",
      };

      const res = await fetch("/api/account/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          data?.error ||
            t("account.profile.errors.generic", {
              fallback: "No se pudo actualizar el perfil.",
            })
        );
      } else {
        setName(data?.user?.name || payload.name);
        setPhone(data?.user?.phone || payload.phone || "");
        toast.success(
          t("account.profile.success", {
            fallback: "Perfil actualizado correctamente.",
          })
        );
        router.refresh();
      }
    } catch (err) {
      toast.error(
        t("account.profile.errors.network", {
          fallback: "Error de red al actualizar el perfil.",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">
            {t("account.profile.fields.name", { fallback: "Nombre" })}
          </FieldLabel>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("account.profile.placeholders.name", {
              fallback: "Tu nombre",
            })}
          />
        </Field>

        <Field>
          <div className="flex justify-between items-center">
            <FieldLabel htmlFor="phone">
              {t("account.profile.fields.phone", { fallback: "Telefono" })}
            </FieldLabel>
            <span className="text-xs text-muted-foreground">
              Este es solo un campo informativo.
            </span>
          </div>
          <PhoneInput
            id="phone"
            name="phone"
            placeholder={t("account.profile.placeholders.phone", {
              fallback: "Tu telefono",
            })}
            value={phone}
            onChange={(value) => setPhone(value || "")}
            international
            defaultCountry="ES"
            aria-invalid={errors.phone ? "true" : "false"}
          />
          {errors.phone ? (
            <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
          ) : null}
        </Field>

        <Field>
          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? t("common.saving", { fallback: "Guardando..." })
              : t("account.profile.actions.submit", {
                  fallback: "Guardar cambios",
                })}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
